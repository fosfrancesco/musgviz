const jsonFileInput = document.getElementById("json-file-input");
jsonFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
        jsonData = JSON.parse(event.target.result); // Store the parsed JSON data in the global variable
        console.log("JSON:", jsonData);
        // Set the desired values using the global variable
        const someValue = jsonData.someProperty;
        console.log("Some value:", someValue);
    });
    reader.readAsText(file);
    });