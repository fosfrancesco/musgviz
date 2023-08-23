document.addEventListener("DOMContentLoaded", (event) => {
    verovio.module.onRuntimeInitialized = async _ => {
        let tk = new verovio.toolkit();
        console.log("Verovio has loaded!");
        tk.setOptions({
            breaks: 'none'
            });

        
        
        const meifileInput = document.getElementById("file-input");
        meifileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = (event) => {
                const meiXML = event.target.result;
                tk.loadData(meiXML);
                const svgString = tk.renderToSVG(1, {});
                svgElement = new DOMParser().parseFromString(svgString, "image/svg+xml").documentElement;
                // get verovio pageElement which have the correct coordinates for notes
                const pageMElemnt = svgElement.querySelector(".page-margin");
                const zip = (...arrays) => {
                    const length = Math.min(...arrays.map((array) => array.length));
                    return Array.from({ length }, (_, i) => arrays.map((array) => array[i]));
                };
                // add the consecutive edges
                addEdges("consecutive", jsonData, svgElement, pageMElemnt, zip, "red");   
                // add the onset edges
                addEdges("onset", jsonData, svgElement, pageMElemnt, zip, "blue");
                // add the during edges
                addEdges("during", jsonData, svgElement, pageMElemnt, zip, "green");
                // add the rest edges
                addEdges("rest", jsonData, svgElement, pageMElemnt, zip, "yellow");
                
                // add the verovio score to the html page
                const outputDiv = document.getElementById("output");
                outputDiv.appendChild(svgElement);
            };
        });
    }
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
});

function addEdges(edgeType, jsonData, svgElement, pageMElemnt, zip, color) {
    for (const [start, end] of zip(jsonData.edge_index_dict[edgeType][0], jsonData.edge_index_dict[edgeType][1])) {
        const element1 = svgElement.querySelector(`#${jsonData.id[start]} use`);
        const element2 = svgElement.querySelector(`#${jsonData.id[end]} use`);
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