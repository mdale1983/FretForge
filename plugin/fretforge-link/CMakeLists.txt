cmake_minimum_required(VERSION 3.14.0)
set(CMAKE_OSX_DEPLOYMENT_TARGET 10.13 CACHE STRING "")

project(FretForgeLink VERSION 0.1.0.0 DESCRIPTION "FretForge Link VST3")

add_subdirectory(external)
smtg_enable_vst3_sdk()

smtg_add_vst3plugin(FretForgeLink
    source/version.h
    source/helloworldcids.h
    source/helloworldprocessor.h
    source/helloworldprocessor.cpp
    source/helloworldcontroller.h
    source/helloworldcontroller.cpp
    source/helloworldentry.cpp
)

target_compile_features(FretForgeLink PRIVATE cxx_std_17)
target_link_libraries(FretForgeLink PRIVATE sdk)
smtg_target_configure_version_file(FretForgeLink)

if(SMTG_WIN)
    target_sources(FretForgeLink PRIVATE resource/win32resource.rc)
    if(MSVC)
        set_property(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT FretForgeLink)
    endif()
endif()
