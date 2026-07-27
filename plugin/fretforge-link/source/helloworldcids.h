//------------------------------------------------------------------------
// Copyright(c) 2022 Steinberg Media Technologies GmbH.
//------------------------------------------------------------------------

#pragma once

#include "pluginterfaces/base/funknown.h"
#include "pluginterfaces/vst/vsttypes.h"

namespace Steinberg {

//------------------------------------------------------------------------
enum HelloWorldParams : Vst::ParamID
{
	kBypassId = 100,

	kParamVolId = 102,
	kParamOnId = 1000
};

//------------------------------------------------------------------------
static const Steinberg::FUID kHelloWorldProcessorUID (0x46524554, 0x464F5247, 0x454C494E, 0x4B303031);
static const Steinberg::FUID kHelloWorldControllerUID (0x46524554, 0x464F5247, 0x454C494E, 0x4B303032);

#define HelloWorldVST3Category "Fx"

//------------------------------------------------------------------------
} // namespace Steinberg
