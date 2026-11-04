let bassAudio = new Audio("./Real Drums Vol. 1/Kick/RD_K_1.wav")
let snareAudio = new Audio("./Real Drums Vol. 1/Snare/RD_S_1.wav")
let hiAudio = new Audio("./Real Drums Vol. 1/Cymbals/Hi Hat/RD_C_HH_1.wav")
let lHiAudio = new Audio("./Real Drums Vol. 1/Cymbals/Hi Hat/RD_C_HH_10.wav")
let crashAudio = new Audio("./Real Drums Vol. 1/Cymbals/Crash/RD_C_C_2.wav")
let highAudio = new Audio("./Real Drums Vol. 1/Toms/High Tom/RD_T_HT_1.wav")
let midAudio = new Audio("./Real Drums Vol. 1/Toms/Mid Tom/RD_T_MT_1.wav")
let floorAudio = new Audio("./Real Drums Vol. 1/Toms/Floor Tom/RD_T_FT_1.wav")

bassAudio.load();
snareAudio.load();
hiAudio.load();
lHiAudio.load();
crashAudio.load();
floorAudio.load();
midAudio.load();
highAudio.load();

bassAudio.volume = 0.3;
snareAudio.volume = 0.3;
hiAudio.volume = 0.3;
lHiAudio.volume = 0.3
floorAudio.volume = 0.3;
crashAudio.volume = 0.3;
highAudio.volume = 0.3;
midAudio.volume = 0.3;

let playing = false;
let trackNode = [];
let domNode = []
let selectedNode = 0
let beat = []
let looping = true;
let loop;
let bpm = 120

for (let i = 0; i < 7; i++ ) { // tracks
    let position = 0;
    for(let j = 1; j < 20; j++) { // notes
        if (j % 5 == 0) {
            let line = document.createElement("div");
            line.className = "line";
            document.getElementsByClassName("noteHolder")[i].appendChild(line);
        } else {
            let note = document.createElement("div");
            note.className = "note";
            note.selected = false;
            note.position = position;
            position++;
            switch(i) {
                case 0:
                    note.type = "bass"
                    break;
                case 1:
                    note.type = "snare"
                    break;
                case 2:
                    note.type = "hi"
                    break;
                case 3:
                    note.type = "floor"
                    break;
                case 4:
                    note.type = "mid"
                    break;
                case 5:
                    note.type = "high"
                    break;
                case 6:
                    note.type = "crash"
                    break;
            }

            note.addEventListener("click", function(event) {
                if (note.selected) {
                    note.selected = false;
                    note.style.backgroundColor = "gray";
                    for(let i = 0; i < beat.length; i++) {
                        if (note == beat[i][0]) {
                            beat.splice(i, 1);
                            break;
                        }
                    }
                } else {
                    note.selected = true;
                    note.style.backgroundColor = "green";
                    if (note.type == "hi" && event.ctrlKey) {
                        note.type = "lhi"
                        note.style.backgroundColor = "blue"
                        beat.push([note, note.type, note.position])
                    } else {
                        beat.push([note, note.type, note.position])
                    }
                    
                }

            })

            document.getElementsByClassName("noteHolder")[i].appendChild(note);
        }
        
    }
}

document.getElementById("bpm").addEventListener("change", function() {
    bpm = document.getElementById("bpm").value;
    document.getElementById("bpmOut").value = bpm;
    document.getElementById("stop").click();
    document.getElementById("play").click();
})

document.getElementById("bpmOut").addEventListener("change", function() {
    bpm = document.getElementById("bpmOut").value;
    document.getElementById("bpm").value = bpm;
    document.getElementById("stop").click();
    document.getElementById("play").click();    
})

document.getElementById("bassVolume").addEventListener("change", function() {
    bassAudio.volume = document.getElementById("bassVolume").value;
})

document.getElementById("snareVolume").addEventListener("change", function() {
    snareAudio.volume = document.getElementById("snareVolume").value;
})

document.getElementById("hiVolume").addEventListener("change", function() {
    hiAudio.volume = document.getElementById("hiVolume").value;
    lHiAudio.volume = hiAudio.volume
})

document.getElementById("floorVolume").addEventListener("change", function() {
    floorAudio.volume = document.getElementById("floorVolume").value;
})

document.getElementById("midVolume").addEventListener("change", function() {
    midAudio.volume = document.getElementById("midVolume").value;
})

document.getElementById("highVolume").addEventListener("change", function() {
    highAudio.volume = document.getElementById("highVolume").value;
})

document.getElementById("crashVolume").addEventListener("change", function() {
    crashAudio.volume = document.getElementById("crashVolume").value;
})

document.getElementById("addNode").addEventListener("click", function() {
    trackNode.push([1, []]);
    let node = document.createElement("div");
    node.className = "trackNode column";
    node.uniqueId = trackNode.length-1

    node.addEventListener("click", function() {
        saveTrack()
        document.getElementById("clear").click();
        domNode[selectedNode].style.border = "2px solid black"
        selectedNode = node.uniqueId;
        node.style.border = "2px solid blue"
        beat = trackNode[selectedNode][1];
        for(let j = 0; j < beat.length; j++) {
            beat[j][0].selected = true;
            if (beat[j][1] == "lhi") {
                beat[j][0].style.backgroundColor = "blue"
            } else {
                beat[j][0].style.backgroundColor = "green"
            }
        }
    })

    let name = document.createElement("p")
    name.innerHTML = "track " + trackNode.length;
    let input = document.createElement("input");
    input.className = "nodeLoop";
    input.type = "text";
    input.value = 1;
    input.addEventListener("change", function() {
        trackNode[node.uniqueId][0] = Number(input.value);
    })

    domNode.push(node);
    node.appendChild(name);
    node.appendChild(input);
    document.getElementById("sequenceHolder").appendChild(node)

})

document.getElementById("addNode").click();
domNode[0].click();

document.getElementById("removeNode").addEventListener("click", function() {
    if (domNode.length != 1) {
        trackNode.splice(selectedNode, 1);
        domNode[selectedNode].remove()
        selectedNode = 0
        domNode[0].click();
    }
})


window.addEventListener("keydown", function(event) {

    if (event.code == "Space") {
        if (!playing) {
            document.getElementById("play").click()
            playing = true;
        } else {
            document.getElementById("stop").click()
            playing = false;
        }
    }
})

document.getElementById("play").addEventListener("click", function(event) {

    if (!playing) {
        playing = true;
        noteLength = 1000/(4 * bpm/60)
        totalTime =  noteLength * 15
        currentTime = 0;
        iteration = 1;
        currentTrack = 0;
        if (event.ctrlKey) {
            saveTrack()
        }
        loop = setInterval(function() {

            if (event.ctrlKey) {
                
                console.log(trackNode[currentTrack])
                console.log(iteration)

                for(let j = 0; j < trackNode[currentTrack][1].length; j++) {
                    process(trackNode[currentTrack][1][j], noteLength, currentTime)
                }

                if (Math.floor(Math.round(currentTime * 1000)) >= Math.floor(Math.round(totalTime * 1000))) {
                    currentTime = 0;
                    if (trackNode[currentTrack][0] == iteration) {
                        iteration = 1;
                        currentTrack++
                        if (currentTrack + 1 > trackNode.length) {
                            currentTrack = 0;
                        }
                    } else {
                        iteration++
                    }
                } else {
                    currentTime += noteLength;
                }

            } else {
                for(let i = 0; i < beat.length; i++) {
                // console.log(Math.floor((beat[i][2] * noteLength) * 1000))
                    process(beat[i], noteLength, currentTime)                    
                }

                if (Math.floor(Math.round(currentTime * 1000)) >= Math.floor(Math.round(totalTime * 1000))) {
                    currentTime = 0;
                } else {
                    currentTime += noteLength;
                }
            }

            // console.log(Math.floor(currentTime * 1000));
            // console.log(beat);

        }, noteLength)
    }
    
})

function process(beat, noteLength, currentTime) {
    if (Math.floor(Math.round((beat[2] * noteLength) * 1000)) == Math.floor(Math.round(currentTime * 1000))) {
        switch(beat[1]) {
            case "bass":
                bassAudio.pause()
                bassAudio.currentTime = 0;
                bassAudio.play();
                break;
            case "snare":
                snareAudio.pause()
                snareAudio.currentTime = 0;
                snareAudio.play();
                break;
            case "hi":
                lHiAudio.pause()
                lHiAudio.currentTime = 0;
                hiAudio.pause()
                hiAudio.currentTime = 0;
                hiAudio.play();
                break;
            case "lhi":
                lHiAudio.pause()
                lHiAudio.currentTime = 0;
                lHiAudio.play();
                break;
            case "floor":
                floorAudio.pause()
                floorAudio.currentTime = 0;
                floorAudio.play();
                break;
            case "high":
                highAudio.pause();
                highAudio.currentTime = 0;
                highAudio.play();
                break;
            case "crash":
                crashAudio.pause()
                crashAudio.currentTime = 0;
                crashAudio.play();
                break;
            case "mid":
                midAudio.pause();
                midAudio.currentTime = 0;
                midAudio.play();
                break;
        }
    }
}

document.getElementById("clear").addEventListener("click", function() {
    let allNotes = document.getElementsByClassName("note");
    for(let i = 0; i < allNotes.length; i++) {
        allNotes[i].selected = false
        allNotes[i].style.backgroundColor = "gray";
    }
    beat = [];
    document.getElementById("stop").click();
})

document.getElementById("stop").addEventListener("click", function() {
    clearInterval(loop);
    playing = false;
})

function saveTrack() {
    trackNode[selectedNode][1] = beat;
}
