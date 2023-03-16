#include <algorithm>
#include <cmath>
#include <set>
#include <limits>
#include <set>
#include <unordered_map>

#include <v8.h>
#include <node.h>
#include <node_object_wrap.h>

#if __linux__
	#include <sys/types.h>
	#include <unistd.h>
	#include <pulse/pulseaudio.h>
#endif

using namespace std;
using namespace v8;
using namespace node;

class Volume : public ObjectWrap {
	public:
		Volume(int pid) : pid(pid) {
			
		}

		~Volume() {
			
		}

		bool is_muted() {
			return false;
		}

		void set_muted(bool value) {
			
		}

		double get_volume() {
			return 0;
		}

		void set_volume(double value) {
			auto volume = max(0.0f, min((float)value, 1.0f));
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
		int pid;

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
					processId = getpid();
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