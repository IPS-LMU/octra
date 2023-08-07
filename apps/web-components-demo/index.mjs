import {AudioManager, WavFormat} from "@octra/media";
import {downloadFile} from "@octra/utilities";

async function main() {
    console.log("loaded");
    const file = await downloadFile("../../apps/octra/src/media/Bahnauskunft.wav");
    const arrayBuffer = await readFileContents(file, "arraybuffer");
    const audioManager = AudioManager.decodeAudio(file.name, file.type, arrayBuffer, [WavFormat]);
    const audioplayer = document.createElement("octra-audioplayer");
    audioplayer.addEventListener("loadComp", (event) => {
        console.log("COMPONENT LOADED");
    });

    const wrapper = document.getElementById("wrapper");
    wrapper.appendChild(audioplayer);
}

window.addEventListener("load", main);
