#include <algorithm>
#include <cmath>
#include <limits>
#include <node.h>
#include <v8.h>

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32__) || defined(__NT__)
	#define NOMINMAX
	#include <Windows.h>
#endif

using namespace std;
using namespace v8;

const double MaxVolume = (double)numeric_limits<unsigned int>::max();

void get_volume(const FunctionCallbackInfo<Value> &args) {
	auto volume = (double)NAN;

	#if defined(WIN32) || defined(_WIN32) || defined(__WIN32__) || defined(__NT__)
		DWORD pdwVolume;

		if(waveOutGetVolume(NULL, &pdwVolume) == MMSYSERR_NOERROR)
			volume = (double)pdwVolume / MaxVolume;
	#endif

	auto isolate = args.GetIsolate();
	args.GetReturnValue().Set(Number::New(isolate, volume));
}

void set_volume(const FunctionCallbackInfo<Value> &args) {
	auto isolate = args.GetIsolate();

	switch(args.Length()) {
		case 1: {
			if(!args[0]->IsNumber()) {
				isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a number").ToLocalChecked()));
				return;
			}

			#if defined(WIN32) || defined(_WIN32) || defined(__WIN32__) || defined(__NT__)
				auto value = args[0].As<Number>()->Value();
				auto volume = (DWORD)(max(0.0, min(value, 1.0)) * MaxVolume);

				if(waveOutSetVolume(NULL, volume) != MMSYSERR_NOERROR)
					isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Unable to set volume").ToLocalChecked()));
			#endif

			break;
		}
		default:
			isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments").ToLocalChecked()));
			return;
	}
}

extern "C" NODE_MODULE_EXPORT void NODE_MODULE_INITIALIZER(
	Local<Object> exports,
	Local<Value> module,
	Local<Context> context
) {
	NODE_SET_METHOD(exports, "getVolume", get_volume);
	NODE_SET_METHOD(exports, "setVolume", set_volume);
}