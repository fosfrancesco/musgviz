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
            if (meiFile !== null) {
                displayScoreWithGraph(meiFile, jsonData, tk);
                instructions.textContent = "";
            }
            else {
                instructions.textContent = "Upload MEI score";
                meifileInput.click();
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
        }
    });
    
}




// event listeners for the toggle checkboxes
// toggle for consecutive edges
const toggleConsecutiveEdgesCheckbox = document.getElementById("toggle-consecutive-edges");
toggleConsecutiveEdgesCheckbox.addEventListener("change", (event) => {
    const consecutiveEdgeElements = document.querySelectorAll(".consecutive_edge");
    consecutiveEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for onset edges
const toggleOnsetEdgesCheckbox = document.getElementById("toggle-onset-edges");
toggleOnsetEdgesCheckbox.addEventListener("change", (event) => {
    const onsetEdgeElements = document.querySelectorAll(".onset_edge");
    onsetEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for during edges
const toggleDuringEdgesCheckbox = document.getElementById("toggle-during-edges");
toggleDuringEdgesCheckbox.addEventListener("change", (event) => {
    const duringEdgeElements = document.querySelectorAll(".during_edge");
    duringEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for rest edges
const toggleRestEdgesCheckbox = document.getElementById("toggle-rest-edges");
toggleRestEdgesCheckbox.addEventListener("change", (event) => {
    const restEdgeElements = document.querySelectorAll(".rest_edge");
    restEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for truth edges
const toggleTruthEdgesCheckbox = document.getElementById("toggle-truth-edges");
toggleTruthEdgesCheckbox.addEventListener("change", (event) => {
    const truthEdgeElements = document.querySelectorAll(".truth_edge");
    truthEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for potential edges
const togglePotentialEdgesCheckbox = document.getElementById("toggle-potential-edges");
togglePotentialEdgesCheckbox.addEventListener("change", (event) => {
    const potentialEdgeElements = document.querySelectorAll(".potential_edge");
    potentialEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for predicted edges
const togglePredictedEdgesCheckbox = document.getElementById("toggle-predicted-edges");
togglePredictedEdgesCheckbox.addEventListener("change", (event) => {
    const predictedEdgeElements = document.querySelectorAll(".predicted_edge");
    predictedEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
}
);
// toggle for chord truth edges
const toggleChordTruthEdgesCheckbox = document.getElementById("toggle-chord-truth-edges");
toggleChordTruthEdgesCheckbox.addEventListener("change", (event) => {
    const chordTruthEdgeElements = document.querySelectorAll(".chord_truth_edge");
    chordTruthEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
});
// toggle for chord potential edges
const toggleChordPotentialEdgesCheckbox = document.getElementById("toggle-chord-potential-edges");
toggleChordPotentialEdgesCheckbox.addEventListener("change", (event) => {
    const chordPotentialEdgeElements = document.querySelectorAll(".chord_potential_edge");
    chordPotentialEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
}
);
// toggle for chord predicted edges
const toggleChordPredictedEdgesCheckbox = document.getElementById("toggle-chord-predicted-edges");
toggleChordPredictedEdgesCheckbox.addEventListener("change", (event) => {
    const chordPredictedEdgeElements = document.querySelectorAll(".chord_predicted_edge");
    chordPredictedEdgeElements.forEach((element) => {
        element.setAttribute("visibility", event.target.checked ? "visible" : "hidden");
    });
}
);




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

        // add the output edges
        // add the truth edges
        addEdges("truth", graph_annotation, pageElemnt, zip, "grey");
        // add the potential edges
        addEdges("potential", graph_annotation, pageElemnt, zip, "orange");
        // add the predicted edges
        addEdges("predicted", graph_annotation, pageElemnt, zip, "orange");
        // add the chord truth edges
        addEdges("chord_truth", graph_annotation, pageElemnt, zip, "grey");
        // add the chord potential edges
        addEdges("chord_potential", graph_annotation, pageElemnt, zip, "orange");
        // add the chord predicted edges
        addEdges("chord_predicted", graph_annotation, pageElemnt, zip, "orange");
        
        // add the verovio score to the html page
        const outputDiv = document.getElementById("output");
        outputDiv.appendChild(svgElement);

        //event listeners if an element with class note is clicked in the svg
        const notes = document.querySelectorAll(".note");
        notes.forEach((note) => {
            note.addEventListener("click", (event) => {
                console.log(note.id);
                //make all edges connected to the note visible
                const edges = document.querySelectorAll(`.${note.id}_edge`);
                edges.forEach((edge) => {
                    edge.setAttribute("visibility", "visible");
                });
                //make all edges not connected to the note invisible
                const otherEdges = document.querySelectorAll(`[class$=_edge]:not(.${note.id}_edge)`);
                otherEdges.forEach((edge) => {
                    edge.setAttribute("visibility", "hidden");
                });
            });
                
    });

        
    };
}

// function addInputEdges(edgeType, jsonGraphAnnotation, pageElemnt, zip, color) {
//     for (const [start, end] of zip(jsonGraphAnnotation.input_edges_dict[edgeType][0], jsonGraphAnnotation.input_edges_dict[edgeType][1])) {
//         addEdges(edgeType, jsonGraphAnnotation, start, end, pageElemnt, color);
//     }
// }

// function addOutputEdges(edgeType, jsonGraphAnnotation, svgElement, pageElemnt, zip, color) {
//     for (const [start, end] of zip(jsonGraphAnnotation.output_edges_dict[edgeType][0], jsonGraphAnnotation.output_edges_dict[edgeType][1])) {
//         addEdges(edgeType, jsonGraphAnnotation, start, end, pageElemnt, color);
        
//     }
// }

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
    }
}
