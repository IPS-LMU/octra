let audioplayer = undefined;
let audioViewer = undefined;
let annotation = undefined;

function initAudioPlayer(audioManager) {
  // <oc-audioplayer> is a web component from web-components library
  audioplayer = document.createElement("octra-audioplayer");
  // connect audiochunk with audioplayer
  audioplayer.audioChunk = audioManager.mainchunk;

  // add audio player to DOM
  const wrapper = document.getElementById("audioplayer-wrapper");
  wrapper.appendChild(audioplayer);
}

function initAudioViewer(audioManager) {
  // import AnnotJSON data from sample ( see at the end of this file)

  const oAudioFile = {
    name: audioManager.resource.info.fullname,
    arrayBuffer: audioManager.resource.arraybuffer,
    size: audioManager.resource.info.size,
    sampleRate: audioManager.resource.info.sampleRate,
    duration: audioManager.resource.info.duration.samples,
    type: audioManager.resource.info.type
  };

  const importResult = new OctraAnnotation.AnnotJSONConverter().import({
    name: "Bahnauskunft_annot.json",
    content: annotationSample,
    type: "application/json",
    encoding: "utf-8"
  }, oAudioFile);

  // retrieve first level object from importResult
  const annotation = OctraAnnotation.OctraAnnotation.deserialize(importResult.annotjson);
  annotation.changeCurrentLevelIndex(0);

  // <octra-audioplayer> is a web component from web-components library
  audioViewer = document.createElement("octra-audioviewer");
  const wrapper = document.getElementById("audioviewer-wrapper");
  wrapper.appendChild(audioViewer);

  // first set audiochunk before applying any settings
  audioViewer.annotation = annotation;
  audioViewer.audioChunk = audioManager.mainchunk;

  // settings
  audioViewer.style.height = "600px";
  audioViewer.refreshOnInternChanges = true;
  audioViewer.isMultiLine = true;
  audioViewer.breakMarker = "<P>";
  audioViewer.settings.showTranscripts = true;
  audioViewer.settings.scrollbar.enabled = true;
  audioViewer.enableShortcuts();

  // events
  audioViewer.addEventListener("entriesChange", (event) => {
    const segments = event.detail;
    // annotation.levels[0] is referenced in audioviewer, so it the changes are automatically available.
  });

}

async function main() {
  // download audio file
  const downloadedBlob = await OctraWebMedia.downloadFile("../../apps/octra/src/media/Bahnauskunft.wav", "blob");
  const file = new File(
    [downloadedBlob],
    "Bahnauskunft.wav",
    {
      type: "audio/wave"
    }
  );

  // read arraybuffer
  const arrayBuffer = await OctraWebMedia.readFileContents(file, "arraybuffer");
  OctraWebMedia.AudioManager.create(file.name, file.type, arrayBuffer, [new OctraWebMedia.WavFormat()]).subscribe({
    next: (status) => {
      console.log(status)

      if (status.progress === 1) {
        // audio was decoded, init audioplayer and audioviewer
        initAudioPlayer(status.audioManager);
        initAudioViewer(status.audioManager);

        // subscribe to audio events
        status.audioManager.statechange.subscribe({
          next: (event) => {
            console.log(`Audio status change!`);
            console.log(event);
          }
        })
      }
    }
  });

  window.playAudioPlayer = function play() {
    if (!audioplayer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioplayer.audioChunk.startPlayback();
    }
  }

  window.pauseAudioPlayer = function pause() {
    if (!audioplayer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioplayer.audioChunk.pausePlayback();
    }
  }

  window.playAudioViewer = function play() {
    if (!audioViewer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioViewer.audioChunk.startPlayback();
    }
  }

  window.pauseAudioViewer = function pause() {
    if (!audioViewer) {
      alert("Audio noch nicht geladen!");
    } else {
      audioViewer.audioChunk.pausePlayback();
    }
  }
}

window.addEventListener("load", main);

const annotationSample = `{
  "name": "Bahnauskunft",
  "annotates": "Bahnauskunft.wav",
  "levels": [
    {
      "name": "OCTRA_1",
      "type": "SEGMENT",
      "items": [
        {
          "id": 1,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 0,
          "sampleDur": 2042
        },
        {
          "id": 2,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Unser"
            }
          ],
          "sampleStart": 2042,
          "sampleDur": 10740
        },
        {
          "id": 3,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sprachdialogsystem"
            }
          ],
          "sampleStart": 12782,
          "sampleDur": 29988
        },
        {
          "id": 4,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "bietet"
            }
          ],
          "sampleStart": 42770,
          "sampleDur": 8159
        },
        {
          "id": 5,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Ihnen"
            }
          ],
          "sampleStart": 50929,
          "sampleDur": 8379
        },
        {
          "id": 6,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Fahrplanauskünfte"
            }
          ],
          "sampleStart": 59308,
          "sampleDur": 28886
        },
        {
          "id": 7,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "rund"
            }
          ],
          "sampleStart": 88194,
          "sampleDur": 5071
        },
        {
          "id": 8,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "um"
            }
          ],
          "sampleStart": 93265,
          "sampleDur": 4189
        },
        {
          "id": 9,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "die"
            }
          ],
          "sampleStart": 97454,
          "sampleDur": 6615
        },
        {
          "id": 10,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhr"
            }
          ],
          "sampleStart": 104069,
          "sampleDur": 5844
        },
        {
          "id": 11,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Wenn"
            }
          ],
          "sampleStart": 109913,
          "sampleDur": 4740
        },
        {
          "id": 12,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 114653,
          "sampleDur": 883
        },
        {
          "id": 13,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Inhalte"
            }
          ],
          "sampleStart": 115536,
          "sampleDur": 13891
        },
        {
          "id": 14,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "des"
            }
          ],
          "sampleStart": 129427,
          "sampleDur": 5292
        },
        {
          "id": 15,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Dialogs"
            }
          ],
          "sampleStart": 134719,
          "sampleDur": 15214
        },
        {
          "id": 16,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Informationen"
            }
          ],
          "sampleStart": 149933,
          "sampleDur": 19184
        },
        {
          "id": 17,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "benötigen"
            }
          ],
          "sampleStart": 169117,
          "sampleDur": 15876
        },
        {
          "id": 18,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 184993,
          "sampleDur": 7056
        },
        {
          "id": 19,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sagen"
            }
          ],
          "sampleStart": 192049,
          "sampleDur": 7497
        },
        {
          "id": 20,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 199546,
          "sampleDur": 3528
        },
        {
          "id": 21,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "einfach"
            }
          ],
          "sampleStart": 203074,
          "sampleDur": 12127
        },
        {
          "id": 22,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 215201,
          "sampleDur": 3088
        },
        {
          "id": 23,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Info"
            }
          ],
          "sampleStart": 218289,
          "sampleDur": 13891
        },
        {
          "id": 24,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 232180,
          "sampleDur": 18963
        },
        {
          "id": 25,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Nennen"
            }
          ],
          "sampleStart": 251143,
          "sampleDur": 8820
        },
        {
          "id": 26,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 259963,
          "sampleDur": 3308
        },
        {
          "id": 27,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "bitte"
            }
          ],
          "sampleStart": 263271,
          "sampleDur": 9701
        },
        {
          "id": 28,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "den"
            }
          ],
          "sampleStart": 272972,
          "sampleDur": 7718
        },
        {
          "id": 29,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "gewünschten"
            }
          ],
          "sampleStart": 280690,
          "sampleDur": 20947
        },
        {
          "id": 30,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 301637,
          "sampleDur": 1324
        },
        {
          "id": 31,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Start"
            }
          ],
          "sampleStart": 302961,
          "sampleDur": 3527
        },
        {
          "id": 32,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "und"
            }
          ],
          "sampleStart": 306488,
          "sampleDur": 4411
        },
        {
          "id": 33,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 310899,
          "sampleDur": 1323
        },
        {
          "id": 34,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Zielbahnhof"
            }
          ],
          "sampleStart": 312222,
          "sampleDur": 22049
        },
        {
          "id": 35,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 334271,
          "sampleDur": 17200
        },
        {
          "id": 36,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "München"
            }
          ],
          "sampleStart": 351471,
          "sampleDur": 11465
        },
        {
          "id": 37,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "und"
            }
          ],
          "sampleStart": 362936,
          "sampleDur": 3308
        },
        {
          "id": 38,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hannover"
            }
          ],
          "sampleStart": 366244,
          "sampleDur": 14333
        },
        {
          "id": 39,
          "labels": [
            {
              "name": "Speaker",
              "value": ""
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 380577,
          "sampleDur": 25303
        },
        {
          "id": 40,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 405880,
          "sampleDur": 41831
        },
        {
          "id": 41,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 447711,
          "sampleDur": 8820
        },
        {
          "id": 42,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "möchten"
            }
          ],
          "sampleStart": 456531,
          "sampleDur": 5733
        },
        {
          "id": 43,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "also"
            }
          ],
          "sampleStart": 462264,
          "sampleDur": 9261
        },
        {
          "id": 44,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 471525,
          "sampleDur": 1984
        },
        {
          "id": 45,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "von"
            }
          ],
          "sampleStart": 473509,
          "sampleDur": 8159
        },
        {
          "id": 46,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 481668,
          "sampleDur": 1102
        },
        {
          "id": 47,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "München"
            }
          ],
          "sampleStart": 482770,
          "sampleDur": 16979
        },
        {
          "id": 48,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 499749,
          "sampleDur": 1543
        },
        {
          "id": 49,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hauptbahnhof"
            }
          ],
          "sampleStart": 501292,
          "sampleDur": 26681
        },
        {
          "id": 50,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 527973,
          "sampleDur": 7938
        },
        {
          "id": 51,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "nach"
            }
          ],
          "sampleStart": 535911,
          "sampleDur": 10143
        },
        {
          "id": 52,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 546054,
          "sampleDur": 3748
        },
        {
          "id": 53,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hannover"
            }
          ],
          "sampleStart": 549802,
          "sampleDur": 18743
        },
        {
          "id": 54,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 568545,
          "sampleDur": 3528
        },
        {
          "id": 55,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hauptbahnhof"
            }
          ],
          "sampleStart": 572073,
          "sampleDur": 26680
        },
        {
          "id": 56,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 598753,
          "sampleDur": 4852
        },
        {
          "id": 57,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "reisen"
            }
          ],
          "sampleStart": 603605,
          "sampleDur": 15434
        },
        {
          "id": 58,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 619039,
          "sampleDur": 16979
        },
        {
          "id": 59,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "richtig"
            }
          ],
          "sampleStart": 636018,
          "sampleDur": 10584
        },
        {
          "id": 60,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 646602,
          "sampleDur": 11025
        },
        {
          "id": 61,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Bitte"
            }
          ],
          "sampleStart": 657627,
          "sampleDur": 1984
        },
        {
          "id": 62,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 659611,
          "sampleDur": 41896
        },
        {
          "id": 63,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "nennen"
            }
          ],
          "sampleStart": 701507,
          "sampleDur": 13009
        },
        {
          "id": 64,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 714516,
          "sampleDur": 4190
        },
        {
          "id": 65,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Datum"
            }
          ],
          "sampleStart": 718706,
          "sampleDur": 14332
        },
        {
          "id": 66,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 733038,
          "sampleDur": 4189
        },
        {
          "id": 67,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "und"
            }
          ],
          "sampleStart": 737227,
          "sampleDur": 8159
        },
        {
          "id": 68,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 745386,
          "sampleDur": 1323
        },
        {
          "id": 69,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhrzeit"
            }
          ],
          "sampleStart": 746709,
          "sampleDur": 12789
        },
        {
          "id": 70,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "für"
            }
          ],
          "sampleStart": 759498,
          "sampleDur": 4851
        },
        {
          "id": 71,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Ihre"
            }
          ],
          "sampleStart": 764349,
          "sampleDur": 5733
        },
        {
          "id": 72,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Reise"
            }
          ],
          "sampleStart": 770082,
          "sampleDur": 12789
        },
        {
          "id": 73,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 782871,
          "sampleDur": 13009
        },
        {
          "id": 74,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sechsundzwanzigster"
            }
          ],
          "sampleStart": 795880,
          "sampleDur": 27784
        },
        {
          "id": 75,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Oktober"
            }
          ],
          "sampleStart": 823664,
          "sampleDur": 12789
        },
        {
          "id": 76,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 836453,
          "sampleDur": 5071
        },
        {
          "id": 77,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "zwölf"
            }
          ],
          "sampleStart": 841524,
          "sampleDur": 8158
        },
        {
          "id": 78,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 849682,
          "sampleDur": 1985
        },
        {
          "id": 79,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhr"
            }
          ],
          "sampleStart": 851667,
          "sampleDur": 8159
        },
        {
          "id": 80,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 859826,
          "sampleDur": 41895
        },
        {
          "id": 81,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 901721,
          "sampleDur": 1102
        },
        {
          "id": 82,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "möchten"
            }
          ],
          "sampleStart": 902823,
          "sampleDur": 9702
        },
        {
          "id": 83,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "also"
            }
          ],
          "sampleStart": 912525,
          "sampleDur": 15876
        },
        {
          "id": 84,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "am"
            }
          ],
          "sampleStart": 928401,
          "sampleDur": 9482
        },
        {
          "id": 85,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 937883,
          "sampleDur": 1102
        },
        {
          "id": 86,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sechsundzwanzigsten"
            }
          ],
          "sampleStart": 938985,
          "sampleDur": 32965
        },
        {
          "id": 87,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Oktober"
            }
          ],
          "sampleStart": 971950,
          "sampleDur": 19073
        },
        {
          "id": 88,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "um"
            }
          ],
          "sampleStart": 991023,
          "sampleDur": 8158
        },
        {
          "id": 89,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 999181,
          "sampleDur": 3529
        },
        {
          "id": 90,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "zwölf"
            }
          ],
          "sampleStart": 1002710,
          "sampleDur": 13450
        },
        {
          "id": 91,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhr"
            }
          ],
          "sampleStart": 1016160,
          "sampleDur": 7497
        },
        {
          "id": 92,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "abfahren"
            }
          ],
          "sampleStart": 1023657,
          "sampleDur": 18743
        },
        {
          "id": 93,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1042400,
          "sampleDur": 13891
        },
        {
          "id": 94,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Korrekt"
            }
          ],
          "sampleStart": 1056291,
          "sampleDur": 14112
        },
        {
          "id": 95,
          "labels": [
            {
              "name": "Speaker",
              "value": ""
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1070403,
          "sampleDur": 1722
        },
        {
          "id": 96,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1072125,
          "sampleDur": 37421
        },
        {
          "id": 97,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Soll"
            }
          ],
          "sampleStart": 1109546,
          "sampleDur": 6394
        },
        {
          "id": 98,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Ihre"
            }
          ],
          "sampleStart": 1115940,
          "sampleDur": 5513
        },
        {
          "id": 99,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Verbindung"
            }
          ],
          "sampleStart": 1121453,
          "sampleDur": 15655
        },
        {
          "id": 100,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1137108,
          "sampleDur": 3529
        },
        {
          "id": 101,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "nur"
            }
          ],
          "sampleStart": 1140637,
          "sampleDur": 6174
        },
        {
          "id": 102,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "aus"
            }
          ],
          "sampleStart": 1146811,
          "sampleDur": 5291
        },
        {
          "id": 103,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1152102,
          "sampleDur": 1324
        },
        {
          "id": 104,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Zügen"
            }
          ],
          "sampleStart": 1153426,
          "sampleDur": 10583
        },
        {
          "id": 105,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "des"
            }
          ],
          "sampleStart": 1164009,
          "sampleDur": 5072
        },
        {
          "id": 106,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Nahverkehrs"
            }
          ],
          "sampleStart": 1169081,
          "sampleDur": 15876
        },
        {
          "id": 107,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "bestehen"
            }
          ],
          "sampleStart": 1184957,
          "sampleDur": 13010
        },
        {
          "id": 108,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1197967,
          "sampleDur": 6835
        },
        {
          "id": 109,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Wenns"
            }
          ],
          "sampleStart": 1204802,
          "sampleDur": 4851
        },
        {
          "id": 110,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1209653,
          "sampleDur": 1323
        },
        {
          "id": 111,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "geht"
            }
          ],
          "sampleStart": 1210976,
          "sampleDur": 6835
        },
        {
          "id": 112,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "nicht"
            }
          ],
          "sampleStart": 1217811,
          "sampleDur": 4410
        },
        {
          "id": 113,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Es"
            }
          ],
          "sampleStart": 1222221,
          "sampleDur": 662
        },
        {
          "id": 114,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "gibt"
            }
          ],
          "sampleStart": 1222883,
          "sampleDur": 3969
        },
        {
          "id": 115,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1226852,
          "sampleDur": 74308
        },
        {
          "id": 116,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "folgende"
            }
          ],
          "sampleStart": 1301160,
          "sampleDur": 18743
        },
        {
          "id": 117,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Verbindungen"
            }
          ],
          "sampleStart": 1319903,
          "sampleDur": 19183
        },
        {
          "id": 118,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1339086,
          "sampleDur": 14554
        },
        {
          "id": 119,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Abfahrt"
            }
          ],
          "sampleStart": 1353640,
          "sampleDur": 13670
        },
        {
          "id": 120,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "am"
            }
          ],
          "sampleStart": 1367310,
          "sampleDur": 11577
        },
        {
          "id": 121,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sechsundzwanzigsten"
            }
          ],
          "sampleStart": 1378887,
          "sampleDur": 33295
        },
        {
          "id": 122,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Oktober"
            }
          ],
          "sampleStart": 1412182,
          "sampleDur": 24806
        },
        {
          "id": 123,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "mit"
            }
          ],
          "sampleStart": 1436988,
          "sampleDur": 29768
        },
        {
          "id": 124,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "ICE"
            }
          ],
          "sampleStart": 1466756,
          "sampleDur": 5292
        },
        {
          "id": 125,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sieben"
            }
          ],
          "sampleStart": 1472048,
          "sampleDur": 9261
        },
        {
          "id": 126,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1481309,
          "sampleDur": 1543
        },
        {
          "id": 127,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "achtundachtzig"
            }
          ],
          "sampleStart": 1482852,
          "sampleDur": 26681
        },
        {
          "id": 128,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "um"
            }
          ],
          "sampleStart": 1509533,
          "sampleDur": 8820
        },
        {
          "id": 129,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "zwölf"
            }
          ],
          "sampleStart": 1518353,
          "sampleDur": 14112
        },
        {
          "id": 130,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhr"
            }
          ],
          "sampleStart": 1532465,
          "sampleDur": 6394
        },
        {
          "id": 131,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "einundzwanzig"
            }
          ],
          "sampleStart": 1538859,
          "sampleDur": 31753
        },
        {
          "id": 132,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "von"
            }
          ],
          "sampleStart": 1570612,
          "sampleDur": 9040
        },
        {
          "id": 133,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1579652,
          "sampleDur": 1543
        },
        {
          "id": 134,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "München"
            }
          ],
          "sampleStart": 1581195,
          "sampleDur": 16979
        },
        {
          "id": 135,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1598174,
          "sampleDur": 1764
        },
        {
          "id": 136,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hauptbahnhof"
            }
          ],
          "sampleStart": 1599938,
          "sampleDur": 27562
        },
        {
          "id": 137,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1627500,
          "sampleDur": 6175
        },
        {
          "id": 138,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Abfahrt"
            }
          ],
          "sampleStart": 1633675,
          "sampleDur": 14332
        },
        {
          "id": 139,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "von"
            }
          ],
          "sampleStart": 1648007,
          "sampleDur": 5953
        },
        {
          "id": 140,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Gleis"
            }
          ],
          "sampleStart": 1653960,
          "sampleDur": 48290
        },
        {
          "id": 141,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "dreiundzwanzig"
            }
          ],
          "sampleStart": 1702250,
          "sampleDur": 17640
        },
        {
          "id": 142,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Ankunft"
            }
          ],
          "sampleStart": 1719890,
          "sampleDur": 4961
        },
        {
          "id": 143,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "in"
            }
          ],
          "sampleStart": 1724851,
          "sampleDur": 1212
        },
        {
          "id": 144,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hannover"
            }
          ],
          "sampleStart": 1726063,
          "sampleDur": 18523
        },
        {
          "id": 145,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1744586,
          "sampleDur": 2646
        },
        {
          "id": 146,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Hauptbahnhof"
            }
          ],
          "sampleStart": 1747232,
          "sampleDur": 26680
        },
        {
          "id": 147,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1773912,
          "sampleDur": 4411
        },
        {
          "id": 148,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "um"
            }
          ],
          "sampleStart": 1778323,
          "sampleDur": 9701
        },
        {
          "id": 149,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1788024,
          "sampleDur": 1765
        },
        {
          "id": 150,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "sechzehn"
            }
          ],
          "sampleStart": 1789789,
          "sampleDur": 17639
        },
        {
          "id": 151,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Uhr"
            }
          ],
          "sampleStart": 1807428,
          "sampleDur": 8820
        },
        {
          "id": 152,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "zweiunddreisig"
            }
          ],
          "sampleStart": 1816248,
          "sampleDur": 25578
        },
        {
          "id": 153,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "an"
            }
          ],
          "sampleStart": 1841826,
          "sampleDur": 5734
        },
        {
          "id": 154,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Gleis"
            }
          ],
          "sampleStart": 1847560,
          "sampleDur": 25577
        },
        {
          "id": 155,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1873137,
          "sampleDur": 4631
        },
        {
          "id": 156,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "acht"
            }
          ],
          "sampleStart": 1877768,
          "sampleDur": 1543
        },
        {
          "id": 157,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Sie"
            }
          ],
          "sampleStart": 1879311,
          "sampleDur": 3529
        },
        {
          "id": 158,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "haben"
            }
          ],
          "sampleStart": 1882840,
          "sampleDur": 5071
        },
        {
          "id": 159,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "jetzt"
            }
          ],
          "sampleStart": 1887911,
          "sampleDur": 5512
        },
        {
          "id": 160,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "die"
            }
          ],
          "sampleStart": 1893423,
          "sampleDur": 3308
        },
        {
          "id": 161,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Auswahl"
            }
          ],
          "sampleStart": 1896731,
          "sampleDur": 15214
        },
        {
          "id": 162,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1911945,
          "sampleDur": 6616
        },
        {
          "id": 163,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Aufgabe"
            }
          ],
          "sampleStart": 1918561,
          "sampleDur": 19844
        },
        {
          "id": 164,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "wiederholen"
            }
          ],
          "sampleStart": 1938405,
          "sampleDur": 17861
        },
        {
          "id": 165,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1956266,
          "sampleDur": 13450
        },
        {
          "id": 166,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "frühere"
            }
          ],
          "sampleStart": 1969716,
          "sampleDur": 12348
        },
        {
          "id": 167,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Verbindung"
            }
          ],
          "sampleStart": 1982064,
          "sampleDur": 14995
        },
        {
          "id": 168,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 1997059,
          "sampleDur": 14553
        },
        {
          "id": 169,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Spätere"
            }
          ],
          "sampleStart": 2011612,
          "sampleDur": 15655
        },
        {
          "id": 170,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Verbindung"
            }
          ],
          "sampleStart": 2027267,
          "sampleDur": 14112
        },
        {
          "id": 171,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2041379,
          "sampleDur": 14994
        },
        {
          "id": 172,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "über"
            }
          ],
          "sampleStart": 2056373,
          "sampleDur": 6394
        },
        {
          "id": 173,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "eine"
            }
          ],
          "sampleStart": 2062767,
          "sampleDur": 8820
        },
        {
          "id": 174,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Rückfahrt"
            }
          ],
          "sampleStart": 2071587,
          "sampleDur": 10584
        },
        {
          "id": 175,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Informieren"
            }
          ],
          "sampleStart": 2082171,
          "sampleDur": 16538
        },
        {
          "id": 176,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2098709,
          "sampleDur": 13671
        },
        {
          "id": 177,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Verbindung"
            }
          ],
          "sampleStart": 2112380,
          "sampleDur": 13891
        },
        {
          "id": 178,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "ändern"
            }
          ],
          "sampleStart": 2126271,
          "sampleDur": 12789
        },
        {
          "id": 179,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2139060,
          "sampleDur": 9041
        },
        {
          "id": 180,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "und"
            }
          ],
          "sampleStart": 2148101,
          "sampleDur": 9481
        },
        {
          "id": 181,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2157582,
          "sampleDur": 4190
        },
        {
          "id": 182,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Kaufen"
            }
          ],
          "sampleStart": 2161772,
          "sampleDur": 11245
        },
        {
          "id": 183,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2173017,
          "sampleDur": 28886
        },
        {
          "id": 184,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Ende"
            }
          ],
          "sampleStart": 2201903,
          "sampleDur": 11687
        },
        {
          "id": 185,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2213590,
          "sampleDur": 46084
        },
        {
          "id": 186,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "Wie"
            }
          ],
          "sampleStart": 2259674,
          "sampleDur": 3748
        },
        {
          "id": 187,
          "labels": [
            {
              "name": "Speaker",
              "value": "OCTRA_1"
            },
            {
              "name": "OCTRA_1",
              "value": "bitte"
            }
          ],
          "sampleStart": 2263422,
          "sampleDur": 9923
        },
        {
          "id": 188,
          "labels": [
            {
              "name": "Speaker",
              "value": ""
            },
            {
              "name": "OCTRA_1",
              "value": "<P>"
            }
          ],
          "sampleStart": 2273345,
          "sampleDur": 47785
        }
      ]
    }
  ],
  "links": [],
  "sampleRate": 22050
}`;

