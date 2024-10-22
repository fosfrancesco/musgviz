// // main function when the page is loaded
// document.addEventListener("DOMContentLoaded", (event) => {
verovio.module.onRuntimeInitialized = async _ => {
    const tk = new verovio.toolkit();
    console.log("Verovio has loaded!");
    tk.setOptions({
        breaks: 'none'
        });  

    const output = document.getElementById("output");
    const instructions = document.getElementById("instructions");
    const meifileInput = document.getElementById("mei-file-input");
    const jsonFileInput = document.getElementById("json-file-input");

    let jsonData = null;
    let meiFile = null;

    /**
     The handler to start playing the file
    **/
    const playMIDIHandler = function () {
        // Get the MIDI file from the Verovio toolkit
        let base64midi = tk.renderToMIDI();
        // Add the data URL prefixes describing the content
        let midiString = 'data:audio/midi;base64,' + base64midi;
        // Pass it to play to MIDIjs
        MIDIjs.play(midiString);
    }

    /**
     The handler to stop playing the file
    **/
    const stopMIDIHandler = function () {
        MIDIjs.stop();
    }

    const midiHightlightingHandler = function (event) {
        // Remove the attribute 'playing' of all notes previously playing
        let playingNotes = document.querySelectorAll('g.note.playing');
        for (let playingNote of playingNotes) playingNote.classList.remove("playing");

        // Get elements at a time in milliseconds (time from the player is in seconds)
        let currentElements = tk.getElementsAtTime(event.time * 1000);

        // Get all notes playing and set the class
        for (note of currentElements.notes) {
            let noteElement = document.getElementById(note);
            if (noteElement) noteElement.classList.add("playing");
        }
    }

    /**
        Wire up the play stop buttons to actually work.
    */
    document.getElementById("playMIDI").addEventListener("click", playMIDIHandler);
    document.getElementById("stopMIDI").addEventListener("click", stopMIDIHandler);
    /**
     Set the function as message callback
    */
    MIDIjs.player_callback = midiHightlightingHandler;

    // event listener for the json file input
    jsonFileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
            jsonData = JSON.parse(event.target.result); // Store the parsed JSON data in the global variable
            instructions.textContent = "Now upload MEI score";
            // enable mei-file-input
            meifileInput.disabled = false;
            jsonFileInput.disabled = true;
            // meifileInput.click();

            // check if the jsonData has a voice_truth key
            if (!("voice_truth" in jsonData)) {
                // disable the value truth in the selected graph-type
                document.getElementById('graph-type').options[4].disabled = true;
                // change the color to light gray
                document.getElementById('graph-type').options[4].style.color = "lightgray";
            }
            // check if the jsonData has a voice_output key
            if (!("voice_output" in jsonData)) {
                // disable the value output in the selected graph-type
                document.getElementById('graph-type').options[3].disabled = true;
                // change the color to light gray
                document.getElementById('graph-type').options[3].style.color = "lightgray";
            }
        });
        reader.readAsText(file);
        
    });

    // event listener for the mei input
    meifileInput.addEventListener("change", (event) => {
        meiFile = event.target.files[0];
        // check if the json file has been uploaded
        if (jsonData === null) {
            instructions.textContent = "Please upload the JSON file first";
            return;
        }
        else {
            displayScoreWithGraph(meiFile, jsonData, tk);
            instructions.textContent = "";
            // enable graph-type switch
            document.getElementById('graph-type').disabled = false;
            meifileInput.disabled = true;
        }
    });

    // graph type switch
    const graphTypeSelect = document.getElementById('graph-type');
    const inputEdgeOptionsDiv = document.getElementById('input-edge-options');
    const candidateEdgeOptionsDiv = document.getElementById('candidate-edge-options');
    const outputEdgeOptionsDiv = document.getElementById('output-edge-options');
    const truthEdgeOptionsDiv = document.getElementById('truth-edge-options');

    // switches
    const consecutiveSwitch = document.getElementById('consecutiveSwitch');
    const onsetSwitch = document.getElementById('onsetSwitch');
    const duringSwitch = document.getElementById('duringSwitch');
    const restSwitch = document.getElementById('restSwitch');
    const voiceCandidateSwitch = document.getElementById('voiceCandidateSwitch');
    const chordCandidateSwitch = document.getElementById('chordCandidateSwitch');
    const voiceOutputSwitch = document.getElementById('voiceOutputSwitch');
    const chordOutputSwitch = document.getElementById('chordOutputSwitch');
    const voiceTruthSwitch = document.getElementById('voiceTruthSwitch');
    const chordTruthSwitch = document.getElementById('chordTruthSwitch');

    const allSwitch = [
        consecutiveSwitch,
        onsetSwitch,
        duringSwitch,
        restSwitch,
        voiceCandidateSwitch,
        chordCandidateSwitch,
        voiceOutputSwitch,
        chordOutputSwitch,
        voiceTruthSwitch,
        chordTruthSwitch
    ];



    // event listener for the graph type switch
    graphTypeSelect.addEventListener('change', function() {
        const consecutiveEdgeElements = document.querySelectorAll(".consecutive_edge");
        const onsetEdgeElements = document.querySelectorAll(".onset_edge");
        const duringEdgeElements = document.querySelectorAll(".during_edge");
        const restEdgeElements = document.querySelectorAll(".rest_edge");

        const voiceCandidateEdgeElements = document.querySelectorAll(".voice_candidate_edge");
        const chordCandidateEdgeElements = document.querySelectorAll(".chord_candidate_edge");

        const voiceOutputEdgeElements = document.querySelectorAll(".voice_output_edge");
        const chordOutputEdgeElements = document.querySelectorAll(".chord_output_edge");

        const voiceTruthEdgeElements = document.querySelectorAll(".voice_truth_edge");
        const chordTruthEdgeElements = document.querySelectorAll(".chord_truth_edge");

        const allEdges = [
            ...consecutiveEdgeElements,
            ...onsetEdgeElements,
            ...duringEdgeElements,
            ...restEdgeElements,
            ...voiceCandidateEdgeElements,
            ...chordCandidateEdgeElements,
            ...voiceOutputEdgeElements,
            ...chordOutputEdgeElements,
            ...voiceTruthEdgeElements,
            ...chordTruthEdgeElements
        ];

        // Hide all edges
        allEdges.forEach((element) => {
            element.setAttribute("visibility", "hidden");
        });
        // Deselect all switches
        allSwitch.forEach((element) => {
            element.checked = false;
        });

        if (graphTypeSelect.value === 'input') {
            inputEdgeOptionsDiv.style.display = 'block';
            candidateEdgeOptionsDiv.style.display = 'none';
            outputEdgeOptionsDiv.style.display = 'none';
            truthEdgeOptionsDiv.style.display = 'none'
        } else if (graphTypeSelect.value === 'candidates') {
            inputEdgeOptionsDiv.style.display = 'none';
            candidateEdgeOptionsDiv.style.display = 'block';
            outputEdgeOptionsDiv.style.display = 'none';
            truthEdgeOptionsDiv.style.display = 'none';
        } else if (graphTypeSelect.value === 'output') {
            inputEdgeOptionsDiv.style.display = 'none';
            candidateEdgeOptionsDiv.style.display = 'none';
            outputEdgeOptionsDiv.style.display = 'block';
            truthEdgeOptionsDiv.style.display = 'none'
        } else if (graphTypeSelect.value === 'truth') {
            inputEdgeOptionsDiv.style.display = 'none';
            candidateEdgeOptionsDiv.style.display = 'none';
            outputEdgeOptionsDiv.style.display = 'none';
            truthEdgeOptionsDiv.style.display = 'block';
        }
    });

    // event listener for the edge options
    consecutiveSwitch.addEventListener('change', function() {
        const consecutiveEdgeElements = document.querySelectorAll(".consecutive_edge");
        consecutiveEdgeElements.forEach((element) => {
            element.setAttribute("visibility", consecutiveSwitch.checked ? "visible" : "hidden");
        });
    });
    onsetSwitch.addEventListener('change', function() {
        const onsetEdgeElements = document.querySelectorAll(".onset_edge");
        onsetEdgeElements.forEach((element) => {
            element.setAttribute("visibility", onsetSwitch.checked ? "visible" : "hidden");
        });
    });
    duringSwitch.addEventListener('change', function() {
        const duringEdgeElements = document.querySelectorAll(".during_edge");
        duringEdgeElements.forEach((element) => {
            element.setAttribute("visibility", duringSwitch.checked ? "visible" : "hidden");
        });
    });
    restSwitch.addEventListener('change', function() {
        const restEdgeElements = document.querySelectorAll(".rest_edge");
        restEdgeElements.forEach((element) => {
            element.setAttribute("visibility", restSwitch.checked ? "visible" : "hidden");
        });
    });

    // event listeners for the candidate elements`
    voiceCandidateSwitch.addEventListener('change', function() {
        const voiceCandidateEdgeElements = document.querySelectorAll(".voice_candidate_edge");
        voiceCandidateEdgeElements.forEach((element) => {
            element.setAttribute("visibility", voiceCandidateSwitch.checked ? "visible" : "hidden");
        });
    });
    chordCandidateSwitch.addEventListener('change', function() {
        const chordCandidateEdgeElements = document.querySelectorAll(".chord_candidate_edge");
        chordCandidateEdgeElements.forEach((element) => {
            element.setAttribute("visibility", chordCandidateSwitch.checked ? "visible" : "hidden");
        });
    });

    // event listeners for the output elements
    voiceOutputSwitch.addEventListener('change', function() {
        const voiceOutputEdgeElements = document.querySelectorAll(".voice_output_edge");
        voiceOutputEdgeElements.forEach((element) => {
            element.setAttribute("visibility", voiceOutputSwitch.checked ? "visible" : "hidden");
        });
    });
    chordOutputSwitch.addEventListener('change', function() {
        const chordOutputEdgeElements = document.querySelectorAll(".chord_output_edge");
        chordOutputEdgeElements.forEach((element) => {
            element.setAttribute("visibility", chordOutputSwitch.checked ? "visible" : "hidden");
        });
    });

    // event listeners for the truth elements
    voiceTruthSwitch.addEventListener('change', function() {
        const voiceTruthEdgeElements = document.querySelectorAll(".voice_truth_edge");
        voiceTruthEdgeElements.forEach((element) => {
            element.setAttribute("visibility", voiceTruthSwitch.checked ? "visible" : "hidden");
        });
    });
    chordTruthSwitch.addEventListener('change', function() {
        const chordTruthEdgeElements = document.querySelectorAll(".chord_truth_edge");
        chordTruthEdgeElements.forEach((element) => {
            element.setAttribute("visibility", chordTruthSwitch.checked ? "visible" : "hidden");
        });
    });
        

    
}


function displayScoreWithGraph(scoreFile, graph_annotation, verovioTk) {
    const reader = new FileReader();
    reader.readAsText(scoreFile);
    reader.onload = (event) => {
        const meiXML = event.target.result;
        verovioTk.loadData(meiXML);
        const svgString = verovioTk.renderToSVG(1, {});
        svgElement = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
        // get verovio pageElement which have the correct coordinates for notes
        const pageElemnt = svgElement.querySelector(".page-margin");
        // define the zip function to iterate over json annotations
        const zip = (...arrays) => {
            const length = Math.min(...arrays.map((array) => array.length));
            return Array.from({ length }, (_, i) => arrays.map((array) => array[i]));
        };
        // add the input edges
        // add the consecutive edges
        addEdges("consecutive", graph_annotation, pageElemnt, zip, "red");   
        // add the onset edges
        addEdges("onset", graph_annotation, pageElemnt, zip, "blue");
        // add the during edges
        addEdges("during", graph_annotation, pageElemnt, zip, "green");
        // add the rest edges
        addEdges("rest", graph_annotation,  pageElemnt, zip, "yellow");

        // add the candidate edges
        // voice candidate edges
        addEdges("voice_candidate", graph_annotation, pageElemnt, zip, "red");
        // chord candidate edges
        addEdges("chord_candidate", graph_annotation, pageElemnt, zip, "blue");

        // add the output edges
        // voice output edges
        addEdges("voice_output", graph_annotation, pageElemnt, zip, "red");
        // chord output edges
        addEdges("chord_output", graph_annotation, pageElemnt, zip, "blue");

        // add the truth edges
        // voice output edges
        addEdges("voice_truth", graph_annotation, pageElemnt, zip, "red");
        // chord output edges
        addEdges("chord_truth", graph_annotation, pageElemnt, zip, "blue");
        
        // add the verovio score to the html page
        const outputDiv = document.getElementById("output");
        outputDiv.appendChild(svgElement);

    };
}

function addEdges(edgeType,jsonGraphAnnotation, pageElement, zip, color) {
    // if the edge type is not in the json file, return
    if (!(edgeType in jsonGraphAnnotation)) {
        return;
    }
    for (const [start, end] of zip(jsonGraphAnnotation[edgeType][0], jsonGraphAnnotation[edgeType][1])) {
        const element1 = pageElement.querySelector(`#${jsonGraphAnnotation.id[start]} use`);
        const element2 = pageElement.querySelector(`#${jsonGraphAnnotation.id[end]} use`);
        const x1 = element1.x.animVal.value + (element1.width.animVal.value / 5);
        const y1 = element1.y.animVal.value;
        const x2 = element2.x.animVal.value + (element2.width.animVal.value / 5);
        const y2 = element2.y.animVal.value;
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        pathElement.setAttribute("stroke", color);
        pathElement.setAttribute("stroke-width", "30");
        pathElement.setAttribute("class", `${edgeType}_edge`);
        // append the id of the starting note as a class
        pathElement.classList.add(`${jsonGraphAnnotation.id[start]}_edge`);
        pageElement.appendChild(pathElement);
        // make the edges invisible by default
        pathElement.setAttribute("visibility", "hidden");
        // set opacity to 0.5
        pathElement.setAttribute("stroke-opacity", "0.3");
    }
}
