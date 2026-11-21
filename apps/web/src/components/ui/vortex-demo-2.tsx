import React from "react";
import { Vortex } from "@/components/ui/vortex";

export default function VortexDemoSecond() {
  return (
    <div className="w-[calc(100%-4rem)] mx-auto rounded-md h-screen overflow-hidden">
      <Vortex
        backgroundColor="#000000"
        rangeY={800}
        particleCount={500}
        baseHue={220}
        className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
      >
        <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
          VYNK Campus Constellation
        </h2>
        <p className="text-white/80 text-sm md:text-2xl max-w-xl mt-6 text-center">
          Find your people. Build breakthrough projects. Master emerging technologies together.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 transition duration-200 rounded-xl text-white font-medium shadow-[0px_2px_0px_0px_#FFFFFF40_inset]">
            Discover People
          </button>
          <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 transition duration-200 rounded-xl text-white font-medium border border-white/10">
            Explore Voyages
          </button>
        </div>
      </Vortex>
    </div>
  );
}
