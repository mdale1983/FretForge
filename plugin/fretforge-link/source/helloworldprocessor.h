//------------------------------------------------------------------------
// Copyright(c) 2022 Steinberg Media Technologies GmbH.
//------------------------------------------------------------------------

#pragma once

#include "public.sdk/source/vst/vstaudioeffect.h"
#include <atomic>
#include <array>
#include <string>
#include <thread>
#include <mutex>

namespace Steinberg {

//------------------------------------------------------------------------
//  HelloWorldProcessor
//------------------------------------------------------------------------
class HelloWorldProcessor : public Steinberg::Vst::AudioEffect
{
public:
	HelloWorldProcessor ();
	~HelloWorldProcessor () SMTG_OVERRIDE;

    // Create function
	static Steinberg::FUnknown* createInstance (void* /*context*/) 
	{ 
		return (Steinberg::Vst::IAudioProcessor*)new HelloWorldProcessor; 
	}

	//--- ---------------------------------------------------------------------
	// AudioEffect overrides:
	//--- ---------------------------------------------------------------------
	/** Called at first after constructor */
	Steinberg::tresult PLUGIN_API initialize (Steinberg::FUnknown* context) SMTG_OVERRIDE;
	
	/** Called at the end before destructor */
	Steinberg::tresult PLUGIN_API terminate () SMTG_OVERRIDE;
	
	/** Switch the Plug-in on/off */
	Steinberg::tresult PLUGIN_API setActive (Steinberg::TBool state) SMTG_OVERRIDE;

	/** Will be called before any process call */
	Steinberg::tresult PLUGIN_API setupProcessing (Steinberg::Vst::ProcessSetup& newSetup) SMTG_OVERRIDE;
	
	/** Asks if a given sample size is supported see SymbolicSampleSizes. */
	Steinberg::tresult PLUGIN_API canProcessSampleSize (Steinberg::int32 symbolicSampleSize) SMTG_OVERRIDE;

	/** Here we go...the process call */
	Steinberg::tresult PLUGIN_API process (Steinberg::Vst::ProcessData& data) SMTG_OVERRIDE;
		
	/** For persistence */
	Steinberg::tresult PLUGIN_API setState (Steinberg::IBStream* state) SMTG_OVERRIDE;
	Steinberg::tresult PLUGIN_API getState (Steinberg::IBStream* state) SMTG_OVERRIDE;
	Steinberg::tresult PLUGIN_API notify (Steinberg::Vst::IMessage* message) SMTG_OVERRIDE;

//------------------------------------------------------------------------
protected:
	bool mBypass = false;
	std::string mInstanceId;
	std::string mSourceName {"FretForge Link"};
	std::mutex mSourceNameMutex;
	std::atomic<bool> mTelemetryRunning {false};
	std::atomic<float> mInputRms {0.0f};
	std::atomic<float> mInputPeak {0.0f};
	std::atomic<double> mSampleRate {0.0};
	std::array<std::atomic<float>, 4096> mAnalysisSamples {};
	std::atomic<uint64_t> mAnalysisWriteIndex {0};
	std::atomic<float> mFrequency {0.0f};
	std::atomic<float> mClarity {0.0f};
	std::thread mTelemetryThread;

	void startTelemetry ();
	void stopTelemetry ();
	void writeTelemetry (bool connected);
	void analyzePitch ();
	static std::string createInstanceId ();
};

//------------------------------------------------------------------------
} // namespace Steinberg
