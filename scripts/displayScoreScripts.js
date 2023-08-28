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

    // // load default mei score and graph annotationsfrom static folder
    // !!!!!!!!! this is not working due to CORS policy !!!!!!!!!
    // const defaultScoreFile = "static/Chopin_Etude_Op.10_No.12.mei";
    // const defaultGraphAnnotationFile = "static/Chopin_Etude_Op.10_No.12.json";
    // fetch(defaultGraphAnnotationFile)
    //     .then(response => response.json())
    //     .then(jsonData => {
    //         displayScoreWithGraph(defaultScoreFile, jsonData, tk)
    //     })
    // .catch(error => console.error(error));

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



function displayScoreWithGraph(scoreFile, graph_annotation, verovioTk) {
    const reader = new FileReader();
    reader.readAsText(scoreFile);
    reader.onload = (event) => {
        const meiXML = event.target.result;
        verovioTk.loadData(meiXML);
        const svgString = verovioTk.renderToSVG(1, {});
        svgElement = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
        // get verovio pageElement which have the correct coordinates for notes
        const pageMElemnt = svgElement.querySelector(".page-margin");
        // define the zip function to iterate over json annotations
        const zip = (...arrays) => {
            const length = Math.min(...arrays.map((array) => array.length));
            return Array.from({ length }, (_, i) => arrays.map((array) => array[i]));
        };
        // add the consecutive edges
        addEdges("consecutive", graph_annotation, svgElement, pageMElemnt, zip, "red");   
        // add the onset edges
        addEdges("onset", graph_annotation, svgElement, pageMElemnt, zip, "blue");
        // add the during edges
        addEdges("during", graph_annotation, svgElement, pageMElemnt, zip, "green");
        // add the rest edges
        addEdges("rest", graph_annotation, svgElement, pageMElemnt, zip, "yellow");
        
        // add the verovio score to the html page
        const outputDiv = document.getElementById("output");
        outputDiv.appendChild(svgElement);
    };
}

function addEdges(edgeType, jsonGraphAnnotation, svgElement, pageMElemnt, zip, color) {
    for (const [start, end] of zip(jsonGraphAnnotation.edge_index_dict[edgeType][0], jsonGraphAnnotation.edge_index_dict[edgeType][1])) {
        const element1 = svgElement.querySelector(`#${jsonGraphAnnotation.id[start]} use`);
        const element2 = svgElement.querySelector(`#${jsonGraphAnnotation.id[end]} use`);
        const x1 = element1.x.animVal.value + (element1.width.animVal.value / 5);
        const y1 = element1.y.animVal.value;
        const x2 = element2.x.animVal.value + (element2.width.animVal.value / 5);
        const y2 = element2.y.animVal.value;
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        pathElement.setAttribute("stroke", color);
        pathElement.setAttribute("stroke-width", "30");
        pathElement.setAttribute("class", `${edgeType}_edge`);
        svgElement.appendChild(pathElement);
        pageMElemnt.appendChild(pathElement);
    }
}