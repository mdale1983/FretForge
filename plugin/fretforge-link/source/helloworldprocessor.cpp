//------------------------------------------------------------------------
// Copyright(c) 2022 Steinberg Media Technologies GmbH.
//------------------------------------------------------------------------

#include "helloworldprocessor.h"
#include "helloworldcids.h"

#include "base/source/fstreamer.h"
#include "pluginterfaces/vst/ivstparameterchanges.h"
#include "public.sdk/source/vst/utility/stringconvert.h"
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <random>
#include <sstream>

using namespace Steinberg;

namespace Steinberg {
//------------------------------------------------------------------------
// HelloWorldProcessor
//------------------------------------------------------------------------
HelloWorldProcessor::HelloWorldProcessor ()
{
	//--- set the wanted controller for our processor
	setControllerClass (kHelloWorldControllerUID);
	mInstanceId = createInstanceId ();
}

//------------------------------------------------------------------------
HelloWorldProcessor::~HelloWorldProcessor ()
{
	stopTelemetry ();
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::initialize (FUnknown* context)
{
	// Here the Plug-in will be instantiated
	
	//---always initialize the parent-------
	tresult result = AudioEffect::initialize (context);
	// if everything Ok, continue
	if (result != kResultOk)
	{
		return result;
	}

	//--- create Audio IO ------
	addAudioInput (STR16 ("Stereo In"), Steinberg::Vst::SpeakerArr::kStereo);
	addAudioOutput (STR16 ("Stereo Out"), Steinberg::Vst::SpeakerArr::kStereo);

	/* If you don't need an event bus, you can remove the next line */
	addEventInput (STR16 ("Event In"), 1);

	return kResultOk;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::terminate ()
{
	// Here the Plug-in will be de-instantiated, last possibility to remove some memory!
	
	//---do not forget to call parent ------
	return AudioEffect::terminate ();
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::setActive (TBool state)
{
	if (state)
		startTelemetry ();
	else
		stopTelemetry ();
	return AudioEffect::setActive (state);
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::process (Vst::ProcessData& data)
{
    //--- Read inputs parameter changes-----------
    if (data.inputParameterChanges)
    {
        int32 numParamsChanged = data.inputParameterChanges->getParameterCount ();
        for (int32 index = 0; index < numParamsChanged; index++)
        {
            Vst::IParamValueQueue* paramQueue =
                data.inputParameterChanges->getParameterData (index);
            if (paramQueue)
            {
                Vst::ParamValue value;
                int32 sampleOffset;
                int32 numPoints = paramQueue->getPointCount ();
                switch (paramQueue->getParameterId ())
                {
                    case HelloWorldParams::kBypassId:
                        if (paramQueue->getPoint (numPoints - 1, sampleOffset, value) ==
                            kResultTrue)
                            mBypass = (value > 0.5f);
                        break;
                }
            }
        }
    }

    //--- Process Audio---------------------
    //--- ----------------------------------
    if (data.numInputs == 0 || data.numOutputs == 0)
    {
        // nothing to do
        return kResultOk;
    }

    if (data.numSamples <= 0)
        return kResultOk;
	const auto processTimestamp = std::chrono::duration_cast<std::chrono::milliseconds> (
		std::chrono::system_clock::now ().time_since_epoch ()).count ();
	mLastProcessTimestampMs.store (processTimestamp, std::memory_order_release);

    const auto inputChannels = data.inputs[0].numChannels;
    const auto outputChannels = data.outputs[0].numChannels;
    double sumSquares = 0.0;
    float peak = 0.0f;
    int64 sampleCount = 0;

    if (data.symbolicSampleSize == Vst::kSample32)
    {
        for (int32 channel = 0; channel < outputChannels; ++channel)
        {
            auto* output = data.outputs[0].channelBuffers32[channel];
            auto* input = channel < inputChannels ? data.inputs[0].channelBuffers32[channel] : nullptr;
            for (int32 sample = 0; sample < data.numSamples; ++sample)
            {
                const float value = input ? input[sample] : 0.0f;
                output[sample] = value * mOutputGain.load (std::memory_order_relaxed);
                if (channel == 0)
                {
                    const auto writeIndex = mAnalysisWriteIndex.fetch_add (1, std::memory_order_relaxed);
                    mAnalysisSamples[writeIndex % mAnalysisSamples.size ()].store (value, std::memory_order_relaxed);
					processAttackSample (value);
                }
                if (channel < inputChannels)
                {
                    sumSquares += static_cast<double> (value) * value;
                    peak = std::max (peak, std::abs (value));
                    ++sampleCount;
                }
            }
        }
    }
    else if (data.symbolicSampleSize == Vst::kSample64)
    {
        for (int32 channel = 0; channel < outputChannels; ++channel)
        {
            auto* output = data.outputs[0].channelBuffers64[channel];
            auto* input = channel < inputChannels ? data.inputs[0].channelBuffers64[channel] : nullptr;
            for (int32 sample = 0; sample < data.numSamples; ++sample)
            {
                const double value = input ? input[sample] : 0.0;
                output[sample] = value * mOutputGain.load (std::memory_order_relaxed);
                if (channel == 0)
                {
                    const auto writeIndex = mAnalysisWriteIndex.fetch_add (1, std::memory_order_relaxed);
                    mAnalysisSamples[writeIndex % mAnalysisSamples.size ()].store (static_cast<float> (value), std::memory_order_relaxed);
					processAttackSample (static_cast<float> (value));
                }
                if (channel < inputChannels)
                {
                    sumSquares += value * value;
                    peak = std::max (peak, static_cast<float> (std::abs (value)));
                    ++sampleCount;
                }
            }
        }
    }

    if (sampleCount > 0)
    {
        mInputRms.store (static_cast<float> (std::sqrt (sumSquares / sampleCount)), std::memory_order_relaxed);
        mInputPeak.store (peak, std::memory_order_relaxed);
    }
	// Anchor the sample clock to this exact REAPER audio callback so a later
	// telemetry write cannot make the detected attack appear late.
	mAudioClockSample.store (mProcessedSamples.load (std::memory_order_acquire), std::memory_order_relaxed);
	mAudioClockTimestampMs.store (processTimestamp, std::memory_order_release);
    return kResultOk;

}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::setupProcessing (Vst::ProcessSetup& newSetup)
{
	mSampleRate.store (newSetup.sampleRate, std::memory_order_relaxed);
	return AudioEffect::setupProcessing (newSetup);
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::canProcessSampleSize (int32 symbolicSampleSize)
{
	// by default kSample32 is supported
	if (symbolicSampleSize == Vst::kSample32)
		return kResultTrue;
	if (symbolicSampleSize == Vst::kSample64)
		return kResultTrue;

	return kResultFalse;
}

void HelloWorldProcessor::processAttackSample (float sample)
{
	const auto flux = std::abs (sample - mPreviousAttackSample);
	mPreviousAttackSample = sample;
	const auto sampleRate = std::max (1.0, mSampleRate.load (std::memory_order_relaxed));
	const auto processed = mProcessedSamples.fetch_add (1, std::memory_order_relaxed) + 1;
	++mSamplesSinceAttack;
	const auto fastCoefficient = flux > mFastAttackEnvelope ? 0.35f : 0.02f;
	mFastAttackEnvelope += fastCoefficient * (flux - mFastAttackEnvelope);
	mSlowAttackEnvelope += 0.003f * (flux - mSlowAttackEnvelope);
	if (mSlowAttackEnvelope < 0.012f)
		mNoiseFloor += 0.0001f * (mSlowAttackEnvelope - mNoiseFloor);
	const auto threshold = std::max (0.0015f, mNoiseFloor * 3.5f);
	const auto refractorySamples = static_cast<uint64_t> (sampleRate * 0.090);
	const auto releaseSamples = static_cast<uint64_t> (sampleRate * 0.025);
	const bool sharpRise = mFastAttackEnvelope > threshold &&
		mFastAttackEnvelope > std::max (mSlowAttackEnvelope * 2.0f, threshold);
	if (!mAttackArmed)
	{
		const bool settled = mFastAttackEnvelope < threshold * 0.85f ||
			mFastAttackEnvelope < mSlowAttackEnvelope * 1.2f;
		mAttackReleaseSamples = settled ? mAttackReleaseSamples + 1 : 0;
		if (mAttackReleaseSamples >= releaseSamples && mSamplesSinceAttack >= refractorySamples)
		{
			mAttackArmed = true;
			mAttackReleaseSamples = 0;
		}
	}
	if (!mAttackArmed || !sharpRise || mSamplesSinceAttack < refractorySamples)
		return;
	mSamplesSinceAttack = 0;
	mAttackArmed = false;
	mAttackReleaseSamples = 0;
	const auto sequence = mAttackSequence.fetch_add (1, std::memory_order_relaxed) + 1;
	const auto slot = sequence % mAttackSampleIndices.size ();
	mAttackSampleIndices[slot].store (processed, std::memory_order_release);
	mAttackStrengths[slot].store (mFastAttackEnvelope, std::memory_order_release);
}

tresult PLUGIN_API HelloWorldProcessor::notify (Vst::IMessage* message)
{
	if (!message || !message->getMessageID () ||
	    std::strcmp (message->getMessageID (), "FretForgeSourceName") != 0)
		return AudioEffect::notify (message);
	Vst::String128 sourceName {};
	if (!message->getAttributes () ||
	    message->getAttributes ()->getString ("SourceName", sourceName, sizeof (sourceName)) != kResultTrue)
		return kResultFalse;
	auto converted = Vst::StringConvert::convert (sourceName);
	if (!converted.empty ())
	{
		std::lock_guard<std::mutex> lock (mSourceNameMutex);
		mSourceName = converted;
	}
	return kResultTrue;
}

std::string HelloWorldProcessor::createInstanceId ()
{
	std::random_device randomDevice;
	std::mt19937_64 generator (randomDevice ());
	std::uniform_int_distribution<uint64_t> distribution;
	std::ostringstream value;
	value << std::hex << std::setfill ('0') << std::setw (16) << distribution (generator);
	return value.str ();
}

void HelloWorldProcessor::startTelemetry ()
{
	if (mTelemetryRunning.exchange (true))
		return;
	mTelemetryThread = std::thread ([this] {
		uint32_t telemetryTick = 0;
		while (mTelemetryRunning.load ())
		{
			refreshOutputGain ();
			if (telemetryTick++ % 3 == 0)
				analyzePitch ();
			writeTelemetry (true);
			std::this_thread::sleep_for (std::chrono::milliseconds (25));
		}
		writeTelemetry (false);
	});
}

void HelloWorldProcessor::refreshOutputGain ()
{
#if SMTG_OS_WINDOWS
	const char* localAppData = std::getenv ("LOCALAPPDATA");
	if (!localAppData) return;
	std::ifstream input (std::filesystem::path (localAppData) / "FretForge" /
		("fretforge-link-" + mInstanceId + ".gain"));
	float gain = 1.0f;
	if (input >> gain)
		mOutputGain.store (std::clamp (gain, 0.0f, 1.5f), std::memory_order_relaxed);
#endif
}

void HelloWorldProcessor::analyzePitch ()
{
	constexpr size_t sampleCount = 2048;
	std::array<float, sampleCount> samples {};
	const auto end = mAnalysisWriteIndex.load (std::memory_order_relaxed);
	if (end < sampleCount)
		return;
	for (size_t index = 0; index < sampleCount; ++index)
		samples[index] = mAnalysisSamples[(end - sampleCount + index) % mAnalysisSamples.size ()].load (std::memory_order_relaxed);
	double energy = 0.0;
	for (const auto sample : samples) energy += static_cast<double> (sample) * sample;
	if (std::sqrt (energy / sampleCount) < 0.0025)
	{
		mFrequency.store (0.0f); mClarity.store (0.0f); return;
	}
	const auto sampleRate = mSampleRate.load (std::memory_order_relaxed);
	const size_t minimumLag = std::max<size_t> (1, static_cast<size_t> (sampleRate / 1200.0));
	const size_t maximumLag = std::min<size_t> (sampleCount - 1, static_cast<size_t> (sampleRate / 55.0));
	size_t bestLag = 0; double bestCorrelation = 0.0;
	for (size_t lag = minimumLag; lag <= maximumLag; ++lag)
	{
		double correlation = 0.0, leftEnergy = 0.0, rightEnergy = 0.0;
		for (size_t index = 0; index < sampleCount - lag; ++index)
		{
			const auto left = samples[index], right = samples[index + lag];
			correlation += left * right; leftEnergy += left * left; rightEnergy += right * right;
		}
		const auto normalized = correlation / std::max (1e-12, std::sqrt (leftEnergy * rightEnergy));
		if (normalized > bestCorrelation) { bestCorrelation = normalized; bestLag = lag; }
	}
	mClarity.store (static_cast<float> (bestCorrelation), std::memory_order_relaxed);
	mFrequency.store (bestLag > 0 && bestCorrelation >= 0.75 ? static_cast<float> (sampleRate / bestLag) : 0.0f, std::memory_order_relaxed);
}

void HelloWorldProcessor::stopTelemetry ()
{
	if (!mTelemetryRunning.exchange (false))
		return;
	if (mTelemetryThread.joinable ())
		mTelemetryThread.join ();
}

void HelloWorldProcessor::writeTelemetry (bool connected)
{
#if SMTG_OS_WINDOWS
	const char* localAppData = std::getenv ("LOCALAPPDATA");
	if (!localAppData)
		return;
	std::filesystem::path directory = std::filesystem::path (localAppData) / "FretForge";
	std::error_code error;
	std::filesystem::create_directories (directory, error);
	std::ofstream output (directory / ("fretforge-link-" + mInstanceId + ".json"), std::ios::trunc);
	if (!output)
		return;
	const auto timestamp = std::chrono::duration_cast<std::chrono::milliseconds> (
		std::chrono::system_clock::now ().time_since_epoch ()).count ();
	std::string sourceName;
	{
		std::lock_guard<std::mutex> lock (mSourceNameMutex);
		sourceName = mSourceName;
	}
	for (size_t position = 0; (position = sourceName.find ('\"', position)) != std::string::npos; position += 2)
		sourceName.replace (position, 1, "\\\"");
	output << "{\"connected\":" << (connected ? "true" : "false")
		<< ",\"instance_id\":\"" << mInstanceId << "\""
		<< ",\"source_name\":\"" << sourceName << "\""
		<< ",\"timestamp_ms\":" << timestamp
		<< ",\"processing_active\":" << (timestamp - mLastProcessTimestampMs.load (std::memory_order_acquire) < 250 ? "true" : "false")
		<< ",\"sample_rate\":" << mSampleRate.load (std::memory_order_relaxed)
		<< ",\"input_rms\":" << mInputRms.load (std::memory_order_relaxed)
		<< ",\"input_peak\":" << mInputPeak.load (std::memory_order_relaxed)
		<< ",\"frequency\":" << mFrequency.load (std::memory_order_relaxed)
		<< ",\"clarity\":" << mClarity.load (std::memory_order_relaxed);
	output << ",\"output_gain\":" << mOutputGain.load (std::memory_order_relaxed);
	const auto latestSequence = mAttackSequence.load (std::memory_order_acquire);
	const auto audioClockTimestamp = mAudioClockTimestampMs.load (std::memory_order_acquire);
	const auto processedSamples = audioClockTimestamp > 0
		? mAudioClockSample.load (std::memory_order_relaxed)
		: mProcessedSamples.load (std::memory_order_acquire);
	const auto attackClockTimestamp = audioClockTimestamp > 0 ? audioClockTimestamp : timestamp;
	const auto sampleRate = std::max (1.0, mSampleRate.load (std::memory_order_relaxed));
	output << ",\"attacks\":[";
	const auto firstSequence = latestSequence > mAttackSampleIndices.size () ? latestSequence - mAttackSampleIndices.size () + 1 : 1;
	bool firstAttack = true;
	for (uint64_t sequence = firstSequence; sequence <= latestSequence; ++sequence)
	{
		const auto slot = sequence % mAttackSampleIndices.size ();
		const auto attackSample = mAttackSampleIndices[slot].load (std::memory_order_acquire);
		if (attackSample == 0 || attackSample > processedSamples) continue;
		const auto ageMilliseconds = static_cast<int64_t> ((processedSamples - attackSample) * 1000.0 / sampleRate);
		if (!firstAttack) output << ',';
		firstAttack = false;
		output << "{\"sequence\":" << sequence
			<< ",\"timestamp_ms\":" << (attackClockTimestamp - ageMilliseconds)
			<< ",\"strength\":" << mAttackStrengths[slot].load (std::memory_order_relaxed) << '}';
	}
	output << ']'
		<< ",\"plugin_version\":\"0.1.0\"}";
#endif
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::setState (IBStream* state)
{
	if (!state)
		return kResultFalse;

	// called when we load a preset or project, the model has to be reloaded

	IBStreamer streamer (state, kLittleEndian);

	float legacyParam1 = 0.f;
	if (streamer.readFloat (legacyParam1) == false)
		return kResultFalse;

	int32 legacyParam2 = 0;
	if (streamer.readInt32 (legacyParam2) == false)
		return kResultFalse;

	int32 savedBypass = 0;
	if (streamer.readInt32 (savedBypass) == false)
		return kResultFalse;

	mBypass = savedBypass > 0;
	int32 idLength = 0;
	if (streamer.readInt32 (idLength) && idLength > 0 && idLength <= 64)
	{
		std::string savedId (static_cast<size_t> (idLength), '\0');
		if (streamer.readRaw (savedId.data (), idLength)) mInstanceId = savedId;
	}

	return kResultOk;
}

//------------------------------------------------------------------------
tresult PLUGIN_API HelloWorldProcessor::getState (IBStream* state)
{
	// here we need to save the model (preset or project)

	int32 toSaveBypass = mBypass ? 1 : 0;

	IBStreamer streamer (state, kLittleEndian);
	streamer.writeFloat (0.f);
	streamer.writeInt32 (0);
	streamer.writeInt32 (toSaveBypass);
	streamer.writeInt32 (static_cast<int32> (mInstanceId.size ()));
	streamer.writeRaw (mInstanceId.data (), static_cast<int32> (mInstanceId.size ())); 

	return kResultOk;
}





//------------------------------------------------------------------------
} // namespace Steinberg
