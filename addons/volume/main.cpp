#include <algorithm>
#include <cmath>
#include <set>
#include <limits>
#include <set>
#include <unordered_map>

#include <v8.h>
#include <node.h>
#include <node_object_wrap.h>

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32__) || defined(__NT__)
	#define NOMINMAX
	#include <Windows.h>
	#include <mmdeviceapi.h>
	#include <audiopolicy.h>
	#include <TlHelp32.h>
#endif

using namespace std;
using namespace v8;
using namespace node;

const double MaxVolume = (double)numeric_limits<unsigned int>::max();

DWORD get_parent_process(DWORD pid) {
	DWORD result = NULL;
	auto handle = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

	PROCESSENTRY32 entry = {0};
	entry.dwSize = sizeof(PROCESSENTRY32);

	if(Process32First(handle, &entry)) {
		do {
			if(entry.th32ProcessID == pid) {
				result = entry.th32ParentProcessID;
				break;
			}
		} while(Process32Next(handle, &entry));
	}

	CloseHandle(handle);

	return result;
}

set<DWORD> get_child_processes(DWORD pid) {
	set<DWORD> pids;
	auto handle = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

	PROCESSENTRY32 entry = {0};
	entry.dwSize = sizeof(PROCESSENTRY32);

	if(Process32First(handle, &entry)) {
		do {
			if(entry.th32ParentProcessID == pid)
				pids.insert(entry.th32ProcessID);

		} while(Process32Next(handle, &entry));
	}

	CloseHandle(handle);

	return pids;
}

set<DWORD> get_sibling_processes(DWORD pid, boolean selfInclusive = true) {
	DWORD parent;
	unordered_map<DWORD, set<DWORD>> entries;

	auto handle = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

	PROCESSENTRY32 entry = {0};
	entry.dwSize = sizeof(PROCESSENTRY32);

	if(Process32First(handle, &entry)) {
		do {
			if(entry.th32ProcessID == pid)
				parent = entry.th32ParentProcessID;

			if(entries.find(entry.th32ParentProcessID) != entries.end())
				entries[entry.th32ParentProcessID].insert(entry.th32ProcessID);
			else
				entries.insert({
					entry.th32ParentProcessID,
					set<DWORD>{entry.th32ProcessID}
				});
		} while(Process32Next(handle, &entry));
	}

	CloseHandle(handle);

	return entries[parent];
}

class Volume : public ObjectWrap {
	public:
		Volume(unsigned long pid) : pid(pid) {
			CoInitialize(NULL);

			IMMDeviceEnumerator *deviceEnumerator;
			CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL ,__uuidof(IMMDeviceEnumerator), (void**)&deviceEnumerator);

			IMMDevice *device;
			deviceEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &device);
			deviceEnumerator->Release();

			device->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&manager);
			device->Release();
		}

		~Volume() {
			manager->Release();

			if(audio != nullptr)
				audio->Release();
		}

		boolean is_muted() {
			if(!ensure_audio())
				return false;

			BOOL mute;
			audio->GetMute(&mute);

			return mute;
		}

		void set_muted(boolean value) {
			if(!ensure_audio())
				return;

			audio->SetMute(value, NULL);
		}

		double get_volume() {
			if(!ensure_audio())
				return 1;

			float volume;
			audio->GetMasterVolume(&volume);

			return (double)volume;
		}

		void set_volume(double value) {
			if(!ensure_audio())
				return;

			auto volume = max(0.0f, min((float)value, 1.0f));
			audio->SetMasterVolume(value, NULL);
		}

		static void init(Local<Object> exports) {
			auto isolate = exports->GetIsolate();
			auto context = isolate->GetCurrentContext();

			auto objectTemplate = ObjectTemplate::New(isolate);
			objectTemplate->SetInternalFieldCount(1);

			auto object = objectTemplate->NewInstance(context).ToLocalChecked();

			auto constructorTemplate = FunctionTemplate::New(isolate, constructor, object);
			constructorTemplate->SetClassName(String::NewFromUtf8(isolate, "Volume").ToLocalChecked());
			constructorTemplate->InstanceTemplate()->SetInternalFieldCount(1);

			NODE_SET_PROTOTYPE_METHOD(constructorTemplate, "isMuted", is_muted);
			NODE_SET_PROTOTYPE_METHOD(constructorTemplate, "setMuted", set_muted);
			NODE_SET_PROTOTYPE_METHOD(constructorTemplate, "getVolume", get_volume);
			NODE_SET_PROTOTYPE_METHOD(constructorTemplate, "setVolume", set_volume);
			
			auto constructor = constructorTemplate->GetFunction(context).ToLocalChecked();
			object->SetInternalField(0, constructor);

			exports->Set(
				context,
				String::NewFromUtf8(isolate, "Volume").ToLocalChecked(),
				constructor
			).FromJust();
		}
	private:
		DWORD pid;
		IAudioSessionManager2 *manager;
		ISimpleAudioVolume *audio = nullptr;

		boolean ensure_audio() {
			if(audio != nullptr)
				return true;

			IAudioSessionEnumerator *sessionEnumerator;
			manager->GetSessionEnumerator(&sessionEnumerator);

			int sessionCount;
			sessionEnumerator->GetCount(&sessionCount);

			auto subprocesses = get_sibling_processes(GetCurrentProcessId());

			for(auto i = 0; i < sessionCount; i++) {
				IAudioSessionControl *control;
				sessionEnumerator->GetSession(i, &control);

				IAudioSessionControl2 *control2;
				control->QueryInterface(IID_PPV_ARGS(&control2));

				DWORD id;
				control2->GetProcessId(&id);
				control2->Release();

				if(subprocesses.find(id) != subprocesses.end()) {
					control->QueryInterface(IID_PPV_ARGS(&audio));

					control->Release();
					sessionEnumerator->Release();

					return true;
				}

				control->Release();
			}

			sessionEnumerator->Release();

			return false;
		}

		static void constructor(const FunctionCallbackInfo<Value> &args) {
			auto isolate = args.GetIsolate();

			if(!args.IsConstructCall()) {
				isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Volume must be invoked as a constructor using new").ToLocalChecked()));
				return;
			}

			auto context = isolate->GetCurrentContext();

			int processId;

			switch(args.Length()) {
				case 0:
					processId = GetCurrentProcessId();
					break;
				case 1:
					if(!args[0]->IsNumber()) {
						isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a number").ToLocalChecked()));
						return;
					}

					processId = args[0].As<Number>()->Value();
					break;
				default:
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
					return;
			}

			Volume *instance = new Volume(processId);
			instance->Wrap(args.This());

			args.GetReturnValue().Set(args.This());
		}

		static void is_muted(const FunctionCallbackInfo<Value> &args) {
			auto isolate = args.GetIsolate();
			auto instance = ObjectWrap::Unwrap<Volume>(args.Holder());

			switch(args.Length()) {
				case 0:
					args.GetReturnValue().Set(Boolean::New(isolate, instance->is_muted()));
					break;
				default:
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
					break;
			}
		}

		static void set_muted(const FunctionCallbackInfo<Value> &args) {
			auto isolate = args.GetIsolate();
			auto instance = ObjectWrap::Unwrap<Volume>(args.Holder());

			switch(args.Length()) {
				case 1: {
					if(!args[0]->IsBoolean()) {
						isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a boolean").ToLocalChecked()));
						return;
					}

					instance->set_muted(args[0].As<Boolean>()->Value());
					break;
				}
				default:
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
					break;
			}
		}

		static void get_volume(const FunctionCallbackInfo<Value> &args) {
			auto isolate = args.GetIsolate();
			auto instance = ObjectWrap::Unwrap<Volume>(args.Holder());

			switch(args.Length()) {
				case 0:
					args.GetReturnValue().Set(Number::New(isolate, instance->get_volume()));
					break;
				default:
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
					break;
			}
		}

		static void set_volume(const FunctionCallbackInfo<Value> &args) {
			auto isolate = args.GetIsolate();
			auto instance = ObjectWrap::Unwrap<Volume>(args.Holder());

			switch(args.Length()) {
				case 1: {
					if(!args[0]->IsNumber()) {
						isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a number").ToLocalChecked()));
						return;
					}

					instance->set_volume(args[0].As<Number>()->Value());
					break;
				}
				default:
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
					break;
			}
		}
};

extern "C" NODE_MODULE_EXPORT void NODE_MODULE_INITIALIZER(
	Local<Object> exports,
	Local<Value> module,
	Local<Context> context
) {
	Volume::init(exports);
}