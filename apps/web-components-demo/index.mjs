
let audioplayer = undefined;

async function main() {
  console.log("loaded");
  const file = new File(
    [await OctraUtilities.downloadFile("../../apps/octra/src/media/Bahnauskunft.wav", "blob")],
    "Bahnauskunft.wav",
    {
      type: "audio/wave"
    }
  );

  console.log(file);
  const arrayBuffer = await OctraUtilities.readFileContents(file, "arraybuffer");
  console.log(arrayBuffer);
  const subscription = OctraMedia.AudioManager.decodeAudio(file.name, file.type, arrayBuffer, [new OctraMedia.WavFormat()]).subscribe({
    next: (status) => {
      console.log(status)

      if(status.decodeProgress === 1) {
        audioplayer = document.createElement("oc-audioplayer");
        audioplayer.addEventListener("loadComp", (event) => {
          console.log("COMPONENT LOADED");
        });
        audioplayer.audioChunk = status.audioManager.mainchunk;

        const wrapper = document.getElementById("wrapper");
        wrapper.appendChild(audioplayer);
      }
    }
  });

  window.play = function play(){
    if(!audioplayer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioplayer.audioChunk.startPlayback();
    }
  }

  window.pause = function pause(){
    if(!audioplayer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioplayer.audioChunk.pausePlayback();
    }
  }
}

window.addEventListener("load", main);
