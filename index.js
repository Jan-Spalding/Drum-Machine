const socketio = require("socket.io")
const express = require("express")
const { Buffer } = require("buffer")
const fs = require("fs")

let exp = express();

exp.get("/ip", function(request, response) {
    console.log(request);
    response.end(request.ip);
});

exp.use(express.static("webroot"))
let webapp = exp.listen(3000, "localhost", function() {
  //console.log("Binding server to device ip on port 3000");
  console.log("Binding server to localhost on port 3000");
})

let io = socketio(webapp);

let sample_rate = 44100
let bit_depth = 32
let channels = 2

let PMC = 1
let IEEE = 3

let path = "./webroot/Real Drums Vol. 1"

let files = [
	["/Kick/RD_K_1.wav", "bass"],
	["/Snare/RD_S_1.wav", "snare"],
	["/Cymbals/Hi Hat/RD_C_HH_1.wav", "hi"],
	["/Cymbals/Hi Hat/RD_C_HH_10.wav", "lhi"],
	["/Cymbals/Crash/RD_C_C_2.wav", "crash"],
	["/Toms/High Tom/RD_T_HT_1.wav", "high"],
	["/Toms/Mid Tom/RD_T_MT_1.wav", "mid"],
	["/Toms/Floor Tom/RD_T_FT_1.wav", "floor"]
]

let file_data = new Array(files.length)

for (let i = 0; i < files.length; i++) {
	fs.readFile(path + files[i][0], null, function(err, data) {
		if (err) {
			console.log(err)
		}

		file_data[i] = data.subarray(56, data.readInt32LE(52))


	})

}

function make_file(samples, sample_rate, bit_depth, channels, format_type) {
	
	let header
	let data_rate = (sample_rate * bit_depth * channels) / 8
	let block_size = (bit_depth * channels) / 8
	// let data_size = (samples.length * channels * bit_depth) / 8

	let data_size = samples.length

	if (format_type == PMC) {

		header = Buffer.allocUnsafe(44) // 44 bytes for header

		header.writeInt32BE(0x52494646, 0) // RIFF
		header.writeInt32LE((data_size + 36), 4) // FILE SIZE
		header.writeInt32BE(0x57415645, 8) // WAVE
		header.writeInt32BE(0x666d7420, 12) // fmt
		header.writeInt32LE(16, 16)
		header.writeInt16LE(format_type, 20) // 1 = PMC , 3 = IEEE
		header.writeInt16LE(channels, 22)
		header.writeInt32LE(sample_rate, 24)
		header.writeInt32LE(data_rate, 28)
		header.writeInt16LE(block_size, 32)
		header.writeInt16LE(bit_depth, 34)
		header.writeInt32BE(0x64617461, 36) // data
		header.writeInt32LE(data_size, 40)

	} else {

		header = Buffer.allocUnsafe(56) // 56 bytes for header

		let samples_per_channel = data_size / channels

		header.writeInt32BE(0x52494646, 0) // RIFF
		header.writeInt32LE((data_size + 48), 4) // FILE SIZE
		header.writeInt32BE(0x57415645, 8) // WAVE
		header.writeInt32BE(0x666d7420, 12) // fmt
		header.writeInt32LE(16, 16)
		header.writeInt16LE(format_type, 20) // 1 = PMC , 3 = IEEE
		header.writeInt16LE(channels, 22)
		header.writeInt32LE(sample_rate, 24)
		header.writeInt32LE(data_rate, 28)
		header.writeInt16LE(block_size, 32)
		header.writeInt16LE(bit_depth, 34)

		header.writeInt32BE(0x66616374, 36) // fact
		header.writeInt32LE(4, 40)
		header.writeInt32LE(samples_per_channel, 44)

		header.writeInt32BE(0x64617461, 48) // data
		header.writeInt32LE(data_size, 52)

	}
	
	
	//let data = Buffer.allocUnsafe(samples.length * 4)
	//max_value = 2**bit_depth / 2 -1
	//let offset = 0

	//for (let i = 0; i < samples.length; i++) {
	//	let value = Math.round(samples[i] * max_value)
	//	data.writeInt16LE(value, offset) // LEFT
	//	data.writeInt16LE(value, offset+2) // RIGHT
	//	offset = i * 4
	//}

	return Buffer.concat([header, samples])
}

function note(frequency) {
	samples = []

	for(let i = 0; i < Math.round(3*sample_rate); i++) {
		let time = i / sample_rate
		let amplitude = 0.5 * Math.sin(2 * Math.PI * frequency * time)
		samples.push(amplitude)
 	}
	
	return samples
}

function add_note(note1, note2) {
	data = []
	
	for(let i = 0; i < note1.length; i++) {
		data.push(note1[i] + note2[i])
	}

	return data
}


function add_sounds(sound1, sound2, bit_depth, channels) {
	let frame_size = bit_depth / 4
	let channel_size = frame_size / channels

	let max = 0
	if (sound1.length > sound2.length) {
		max = sound2.length
	} else {
		max = sound1.length
	}

	let channel_1 = Buffer.allocUnsafe(channel_size)
	let channel_2 = Buffer.allocUnsafe(channel_size)

	let data = []

	for(let i = 0; i < max; i+=frame_size) {
		let channel_1_1 = Buffer.copyBytesFrom(sound1, i, channel_size)
		let channel_2_1 = Buffer.copyBytesFrom(sound1, i + channel_size, channel_size)

		let channel_1_2 = Buffer.copyBytesFrom(sound2, i, channel_size)
		let channel_2_2 = Buffer.copyBytesFrom(sound2, i + channel_size, channel_size)

		let channel_1_value = (channel_1_1.readFloatLE() + channel_1_2.readFloatLE()) / 2
		let channel_2_value = (channel_2_1.readFloatLE() + channel_2_2.readFloatLE()) / 2

		channel_1.writeFloatLE(channel_1_value)
		channel_2.writeFloatLE(channel_2_value)

		data.push(Buffer.from(channel_1))
		data.push(Buffer.from(channel_2))
	}

	return Buffer.concat(data)
}

function addSounds(buffer, offset, data, volume) {
	let frame_size = (bit_depth * channels) / 8
	let channel_size = frame_size / channels
	let interval = 0

	let channel = Buffer.allocUnsafe(channel_size)

	for(let i = 0; i < data.length; i++) {
		if (interval == data.length) {
			break;
		}

		// console.log(buffer.readFloatLE(interval))

		let value = buffer.readFloatLE(offset + interval) + ( data.readFloatLE(interval) * volume )

		channel.writeFloatLE(value)

		buffer.set(channel, offset + interval)

		interval = i * channel_size

	}
	
	return buffer
	
}

function processData(data, volume, bpm) {

	let data_size = 0

	for(let i = 0; i < data.length; i++) {
		data_size += data[i][0]
	}

	console.log(data_size)
	
	let beat_length = 1000 / (bpm/60)

	let size = (((data_size * beat_length*4) /1000) * sample_rate * channels * bit_depth) / 8// 4 beats per bar

	let file = Buffer.alloc(size)

	let offset = 0

	for(let i = 0; i < data.length; i++) {
		for(let j = 0; j < data[i][0]; j++) {
			for(let k = 0; k < files.length; k++) {
				for(let l = 0; l < data[i][1].length; l++) {

					if (files[k][1] == data[i][1][l][1]) {
						let pos = data[i][1][l][2] + offset
						console.log("play: " + files[k][1] + " on " + pos)
						
						let start_sec = beat_length * ((pos / 4))

						let start_sample = Math.round((start_sec / 1000) * sample_rate)

						let frame_size = (channels * bit_depth) / 8

						file = addSounds(file, start_sample * frame_size, file_data[k], eval("volume." + files[k][1])/2)
					}

				}
			}

			offset += 16

		}
	}

	// for(let i = 0; i < files.length; i++) {
	// 	for(let j = 0; j < data[0][1].length; j++) {
			
	// 		if (files[i][1] == data[0][1][j][1]) {
	// 			console.log("play: " + files[i][1] + " on " + data[0][1][j][2])


	// 			let start_sec = beat_length * (data[0][1][j][2] / 4)

	// 			let start_sample = Math.round((start_sec / 1000) * sample_rate)

	// 			let frame_size = (channels * bit_depth) / 8

	// 			// console.log(start_sample)
	// 			// console.log(start_sample * frame_size)	

	// 			file = addSounds(file, start_sample * frame_size, file_data[i], eval("volume." + files[i][1])/2)			

	// 			//file.set(file_data[i], start_sample * frame_size)
	// 			//file.set(file_data[i])
	// 		}

	// 	}
	// }

	return file
}



io.on("connection", function(socket) {

	function write_file(data) {
		// console.log(data)
		fs.writeFile("test.wav", data, function(err) {
			if (err) {
				console.log(err)
			}

			sendFile()

		})
	}

	function sendFile() {
		let file = fs.createReadStream("test.wav") 

		file.on("data", function(chunk) {
			socket.emit("export", chunk)
		})

		file.on("end", function() {
			socket.emit("done")
		})
	}

	console.log("USER CONNECTED | " + socket.id);

	socket.on("makefile", function(data, volume, bpm) {

		// console.log(processData(data, volume, bpm))

		// console.log(data)

		write_file(make_file(processData(data, volume, bpm), sample_rate, bit_depth, channels, IEEE))

		//let notes = add_note(note(500), note(502))  
  		//write_file(make_file(notes, sample_rate, bit_depth, channels))
	})

	socket.on("disconnect", function() {
		console.log("USER DICONNECTED | " + socket.id);
	})
});