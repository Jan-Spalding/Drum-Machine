let socket = io();

let client_id;

socket.on("connected", function(messages, id) {
    console.log(id);
    client_id = id;
})

document.getElementById("toMP3").addEventListener("click", function() {
	volumes = {
		"bass": bassAudio.volume,
		"snare": snareAudio.volume,
		"hi": hiAudio.volume,
		"lHi": lHiAudio.volume,
		"floor": floorAudio.volume,
		"crash": crashAudio.volume,
		"high": highAudio.volume,
		"mid": midAudio.volume
	}

	socket.emit("makefile", trackNode, volumes, bpm)
})

let data = []

socket.on("export", function(chunk) {
	data.push(chunk)
})

socket.on("done", function() {
	url = URL.createObjectURL(new File(data, "sound.wav"))
	let a = document.createElement("a")
	a.style.display = "none"
	a.href = url
	a.download = "sound.wav"
	document.body.appendChild(a)
	a.click()

	a.remove()
	URL.revokeObjectURL(url)
	// window.open(url, "_blank")
})