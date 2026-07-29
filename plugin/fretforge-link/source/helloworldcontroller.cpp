//------------------------------------------------------------------------
// Copyright(c) 2022 Steinberg Media Technologies GmbH.
//------------------------------------------------------------------------

#include "helloworldcontroller.h"
#include "helloworldcids.h"
#include "base/source/fstreamer.h"
#include "pluginterfaces/base/ibstream.h"

using namespace Steinberg;

namespace Steinberg {

//------------------------------------------------------------------------
// HelloWorldController Implementation
//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::initialize (FUnknown* context)
{
	// Here the Plug-in will be instantiated

	//---do not forget to call parent ------
	tresult result = EditControllerEx1::initialize (context);
	if (result != kResultOk)
	{
		return result;
	}

	// Here you could register some parameters
	if (result == kResultTrue)
	{
		//---Create Parameters------------
		parameters.addParameter (STR16 ("Bypass"), nullptr, 1, 0,
		                         Vst::ParameterInfo::kCanAutomate | Vst::ParameterInfo::kIsBypass,
		                         HelloWorldParams::kBypassId);

	}

	return result;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::terminate ()
{
	// Here the Plug-in will be de-instantiated, last possibility to remove some memory!

	//---do not forget to call parent ------
	return EditControllerEx1::terminate ();
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::setComponentState (IBStream* state)
{
	// Here you get the state of the component (Processor part)
	if (!state)
		return kResultFalse;

	IBStreamer streamer (state, kLittleEndian);
	float legacyParam1 = 0.f;
	int32 legacyParam2 = 0;
	int32 bypassState = 0;
	if (!streamer.readFloat (legacyParam1) || !streamer.readInt32 (legacyParam2) ||
	    !streamer.readInt32 (bypassState))
		return kResultFalse;
	setParamNormalized (HelloWorldParams::kBypassId, bypassState ? 1.0 : 0.0);
	return kResultOk;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::setState (IBStream* state)
{
	// Here you get the state of the controller

	return kResultTrue;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::getState (IBStream* state)
{
	// Here you are asked to deliver the state of the controller (if needed)
	// Note: the real state of your plug-in is saved in the processor

	return kResultTrue;
}

//------------------------------------------------------------------------
IPlugView* PLUGIN_API HelloWorldController::createView (FIDString name)
{
	(void)name;
	return nullptr;
}

tresult PLUGIN_API HelloWorldController::setChannelContextInfos (Vst::IAttributeList* list)
{
	if (!list)
		return kResultFalse;
	Vst::String128 channelName {};
	if (list->getString (Vst::ChannelContext::kChannelNameKey, channelName,
	                     sizeof (channelName)) != kResultTrue)
		return kResultFalse;
	if (auto message = owned (allocateMessage ()))
	{
		message->setMessageID ("FretForgeSourceName");
		message->getAttributes ()->setString ("SourceName", channelName);
		return sendMessage (message);
	}
	return kResultFalse;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::setParamNormalized (Vst::ParamID tag, Vst::ParamValue value)
{
	// called by host to update your parameters
	tresult result = EditControllerEx1::setParamNormalized (tag, value);
	return result;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::getParamStringByValue (Vst::ParamID tag, Vst::ParamValue valueNormalized, Vst::String128 string)
{
	// called by host to get a string for given normalized value of a specific parameter
	// (without having to set the value!)
	return EditControllerEx1::getParamStringByValue (tag, valueNormalized, string);
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldController::getParamValueByString (Vst::ParamID tag, Vst::TChar* string, Vst::ParamValue& valueNormalized)
{
	// called by host to get a normalized value from a string representation of a specific parameter
	// (without having to set the value!)
	return EditControllerEx1::getParamValueByString (tag, string, valueNormalized);
}

//------------------------------------------------------------------------
} // namespace Steinberg
