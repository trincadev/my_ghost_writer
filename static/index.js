
function previewFile() {
    const editor = document.getElementById("editor");
    const [file] = document.querySelector("input[type=file]").files;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
            // this will then display a text file
            editor.innerText = reader.result;
        }, false
    );
    if (file) {
        reader.readAsText(file);
    }
}
function setCaret(line, offsetColumn, nTotalRows, negativeOffsetPerc=0.12) {
    let editorElement = document.getElementById("editor");
    let validChildNodes = []
    // use a for loop because of better performance
    for (let i=0; i < editorElement.childNodes.length; i++) {
        let childNode = editorElement.childNodes[i]
        if (childNode.innerHTML !== "") {
            validChildNodes.push(childNode)
        }
    }
    let rng = document.createRange();
    let sel = window.getSelection();
    let col0 = offsetColumn[0]
    let col1 = offsetColumn[1]
    rng.setStart(validChildNodes[line], col0);
    rng.setEnd(validChildNodes[line], col1)
    sel.removeAllRanges();
    sel.addRange(rng);
    editorElement.focus();
    // try to scroll div to row... font-size on div is 12px
    let scrollHeight = parseFloat(editorElement.scrollHeight, 10)
    console.log("setCaret::updatedOffsetPosition:scroll to line/height position/int height position:", line, editorElement.scrollHeight, scrollHeight, "#")
    let offsetToScrollPerc = line / nTotalRows
    let offsetToScroll = scrollHeight * offsetToScrollPerc
    // if already at the end of the page, don't scroll anymore to avoid missing words in the upper side of the viewport
    if (offsetToScrollPerc < (1-negativeOffsetPerc)) {
        offsetToScroll -= offsetToScroll*negativeOffsetPerc
    }
    let offsetToScrollInt = parseInt(offsetToScroll, 10)
    console.log("setCaret::offsetToScroll:", offsetToScrollInt, "|", offsetToScroll, "#")
    editorElement.scrollTo(0, offsetToScrollInt)
}
const setElementCssClass = (elementId, currentClass) => {
    let spanWaitingFor = document.getElementById(elementId)
    spanWaitingFor.setAttribute("class", currentClass)
}
const getWordFrequency = async () => {
    let text = document.getElementById("editor")
    // replace repeated newlines to prepare setCaret() use
    text.innerText = text.innerText.replace(/[\r\n]+/g, '\n')
    let bodyRequest = {"text": text.innerText}
    setElementCssClass("waiting-for-be-error", "display-none")
    setElementCssClass("waiting-for-be", "display-block")
    let wordsFrequency = document.getElementById("words-frequency")
    wordsFrequency.innerHTML = ""
    try {
        let response = await fetch("/words-frequency", {
            method: "POST",
            body: JSON.stringify(bodyRequest)
        })
        console.log("getWordFreq::response.status:", response.status, "#")
        console.assert(response.status, 200)
        let bodyResponseJson = await response.json()
        setElementCssClass("waiting-for-be", "display-none")
        console.log("getWordFreq::body keys:", Object.keys(bodyResponseJson), "#")
        let freq = bodyResponseJson["words_frequency"]
        let nTotalRows = bodyResponseJson["n_total_rows"]
        console.log("getWordFreq::tot;:", nTotalRows, "#")
        populateWordFrequencyTable(freq, bodyResponseJson["n_total_rows"])
    } catch (err) {
        console.error("getWordFrequency::err:", err, "#")
        setElementCssClass("waiting-for-be", "display-none")
        setElementCssClass("waiting-for-be-error", "display-block")
    }
}
const populateWordFrequencyTable = (wordsFrequencyObj, nTotalRows) => {
    const wfo = JSON.parse(wordsFrequencyObj)
    const reduced = Object.values(wfo)
    let wordsFrequency = document.getElementById("words-frequency")
    wordsFrequency.innerHTML = ""
    for (let i=0; i<reduced.length; i++ ) {
        let iReduced = reduced[i]
        let currentTableWordFreq = document.createElement("table")
        currentTableWordFreq.setAttribute("class", "border-black")
        currentTableWordFreq.setAttribute("id", `id-table-${i}-nth`)
        currentTableWordFreq.setAttribute("aria-label", `id-table-${i}-nth`)
        currentTableWordFreq.createCaption(`count: ${iReduced["count"]}, word: '${iReduced["word_prefix"]}'`)
        let currentTHead = document.createElement("thead")
        let currentTHeadRow = currentTHead.insertRow()
        currentTHeadRow.insertCell().textContent = 'word'
        currentTHeadRow.insertCell().textContent = 'row nth'
        currentTHeadRow.insertCell().textContent = 'offsets'

        let currentTBody = document.createElement("tbody")
        let offsetsArray = iReduced.offsets_array
        for (let ii=0; ii < offsetsArray.length; ii++) {
            let nthOffset = offsetsArray[ii]
            let nthRowBody = currentTBody.insertRow()
            nthRowBody.setAttribute("id", `id-table-${i}-row-${ii}-nth`)
            nthRowBody.setAttribute("aria-label", `id-table-${i}-row-${ii}-nth`)
            let currentCell = nthRowBody.insertCell()
            let currentUrl = document.createElement("a")
            currentUrl.addEventListener("click", function() {
                let nRow = nthOffset["n_row"]
                let offsetWord = nthOffset["offsets"]
                setCaret(nRow, offsetWord, nTotalRows)
                try {
                    let oldClassElement = document.getElementsByClassName('underlinedDarkViolet')
                    oldClassElement[0].className = "underlinedBlue"
                } catch {
                    console.log("first click...")
                }
                currentUrl.className = "underlinedDarkViolet"
            })
            currentUrl.className = "underlinedBlue"
            currentUrl.innerText = nthOffset["word"]
            currentCell.appendChild(currentUrl)
            nthRowBody.insertCell().textContent = nthOffset["n_row"]
            nthRowBody.insertCell().textContent = nthOffset["offsets"]
        }
        currentTableWordFreq.appendChild(currentTHead)
        currentTableWordFreq.appendChild(currentTBody)
        wordsFrequency.appendChild(currentTableWordFreq)
    }
}