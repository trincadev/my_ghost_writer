const wordsFrequencyTableTitleText = "Words Frequency Table"
let wfo = {
    "words_frequency": {},
    "nTotalRows": null
}
const editorFieldLabel = "editor"
const remoteWebServer = ""
const underlinedPrimary = "underlinedBlue"
const underlinedClicked = "underlinedDarkViolet"

const getFormDataByKey = (formId, key) => {
    let formElement = document.getElementById(formId)
    const data = new FormData(formElement);
    let dataValue = data.get(key)
    return dataValue
}

/**
 * Read and preview a selected text file.
 *
 * @function previewFile
 * @description Displays the contents of a selected text file within an element with id 'editor'.
 * @param {none}
 */
const previewFile = () => {
    const editor = document.getElementById(editorFieldLabel);
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

/**
 * Scrolls an editor element to a specific y coordinate (calculated using given lines/rows number).
 *
 * @function scrollToGivenPoint
 * @param {HTMLElement} editorElement The HTML element id of the editor.
 * @param {number} line The line/row number to scroll to (0-indexed).
 * @param {number} nTotalRows The total number of text lines/rows.
 * @param {number} [negativeOffsetPerc=0.12] An optional percentage value to add a negative offset, preventing scrolling beyond the end of the viewport.
 */
const scrollToGivenPoint = (editorElement, line, nTotalRows, negativeOffsetPerc=0.12) => {
    // try to scroll div to row... font-size on div is 12px
    let scrollHeight = parseFloat(editorElement.scrollHeight, 10)
    let offsetToScrollPerc = line / nTotalRows
    let offsetToScroll = scrollHeight * offsetToScrollPerc
    // if already at the end of the page, don't scroll anymore to avoid missing words in the upper side of the viewport
    if (offsetToScrollPerc < (1 - negativeOffsetPerc)) {
        offsetToScroll -= offsetToScroll * negativeOffsetPerc
    }
    let offsetToScrollInt = parseInt(offsetToScroll, 10)
    editorElement.scrollTo(0, offsetToScrollInt)
}

/**
 * Scrolls the editor to a specified position and sets the caret at that point.
 *
 * @param {number} line - The line/row number (0-indexed) where the caret should be placed.
 * @param {Array<number>} offsetColumn - A number array containing two numbers representing the column offsets for the start and end of the selection range.
 * @param {number} nTotalRows - The total number of lines/rows in the editor for scrolling purposes.
 * @param {number} [negativeOffsetPerc=0.12] - A percentage value used to offset the vertical scroll position (default: 0.12).
 */
const setCaret = (line, offsetColumn, nTotalRows, negativeOffsetPerc=0.12) => {
    let editorElement = document.getElementById(editorFieldLabel);
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
    scrollToGivenPoint(editorElement, line, nTotalRows, negativeOffsetPerc);
}

/**
 * Updates the CSS class of an HTML element with the specified ID.
 *
 * @param {string} elementId - The ID of the HTML element to update.
 * @param {string} currentClass - The new CSS class to apply to the element.
 */
const setElementCssClass = (elementId, currentClass) => {
    let spanWaitingFor = document.getElementById(elementId)
    spanWaitingFor.setAttribute("class", currentClass)
}

/**
 * Fetches words frequency data from the server and populates the words frequency tables.
 * 
 * @async
 * @function getWordsFrequency
 */
const getWordsFrequency = async () => {
    let text = document.getElementById(editorFieldLabel)
    // replace repeated newlines to prepare setCaret() use
    text.innerText = text.innerText.replace(/[\r\n]+/g, '\n')
    let bodyRequest = {"text": text.innerText}
    setElementCssClass("waiting-for-be-error", "display-none")
    setElementCssClass("waiting-for-be", "display-block")
    let wordsFrequencyTableTitleEl = document.getElementById("id-words-frequency-table-title")
    wordsFrequencyTableTitleEl.innerText = wordsFrequencyTableTitleText
    let wordsFrequency = document.getElementById("words-frequency")
    wordsFrequency.innerHTML = ""
    try {
        let response = await fetch(`${remoteWebServer}/words-frequency`, {
            method: "POST",
            body: JSON.stringify(bodyRequest)
        })
        console.assert(response.status, 200)
        let bodyResponseJson = await response.json()
        setElementCssClass("waiting-for-be", "display-none")
        let freq = bodyResponseJson["words_frequency"]
        let nTotalRows = bodyResponseJson["n_total_rows"]
        console.log(`getWordsFreq::nTotalRows: '${nTotalRows}'`)
        populateWordsFrequencyTables(freq, bodyResponseJson["n_total_rows"])
    } catch (err) {
        console.error("getWordsFrequency::err:", err, "#")
        setElementCssClass("waiting-for-be", "display-none")
        setElementCssClass("waiting-for-be-error", "display-block")
    }
}

function dynamicsort(property, order) {
    let sort_order = 1;
    if(order === "desc"){
        sort_order = -1;
    }
    return function (a, b){
        // a should come before b in the sorted order
        if(a[property] < b[property]){
                return -1 * sort_order;
        // a should come after b in the sorted order
        }else if(a[property] > b[property]){
                return 1 * sort_order;
        // a and b are the same
        }else{
                return 0 * sort_order;
        }
    }
}

function filteredArray(arr, key, value) {
    const newArray = [];
    for(let i=0, l=arr.length; i<l; i++) {
        let currentElement = arr[i]
        let currentValue = currentElement[key]
        if(currentValue.toLowerCase().includes(value)) {
            newArray.push(arr[i]);
        }
    }
   return newArray;
}

const updateWordsFrequencyTables = () => {
    let nTotalRows = wfo["nTotalRows"]
    if (nTotalRows === null || nTotalRows < 1) {
        alert("let's get some data before updating the result table...")
    }

    let _wfo = wfo["words_frequency"]
    let reduced = Object.values(_wfo)
    let order = getFormDataByKey("id-form-order-by", "order")
    let sort = getFormDataByKey("id-form-sort-by", "sort")
    reduced.sort(dynamicsort(sort, order))

    let inputFilter = document.getElementById("filter-words-frequency")
    let inputFilterValue = inputFilter.value
    if (inputFilterValue != undefined && inputFilter.value !== "") {
        reduced = filteredArray(reduced, "word_prefix", inputFilterValue)
    }

    let wordsFrequency = document.getElementById("words-frequency")
    wordsFrequency.innerHTML = ""
    let wordsFrequencyTableTitleEl = document.getElementById("id-words-frequency-table-title")
    wordsFrequencyTableTitleEl.innerText = `${wordsFrequencyTableTitleText} (${reduced.length} word groups, ${nTotalRows} rows)`
    for (let i=0; i<reduced.length; i++ ) {
        insertCurrentTable(i, reduced[i], nTotalRows, wordsFrequency);
    }
}

/**
 * Populate the words frequency tables in the UI with data from the provided JSON object.
 *
 * @param {string} wordsFrequencyObj - The JSON string containing word frequencies.
 * @param {number} nTotalRows - The total number of lines/rows to display for each word group.
 */
const populateWordsFrequencyTables = (wordsFrequencyObj, nTotalRows) => {
    wfo["words_frequency"] = JSON.parse(wordsFrequencyObj)
    wfo["nTotalRows"] = nTotalRows
    updateWordsFrequencyTables()
}

/**
 * Inserts a table into the DOM displaying the frequency of word prefixes and their corresponding row nths and offsets.
 *
 * @param {number} i - The current index being processed (needed for adding unique HTML id/aria-labels).
 * @param {object} iReduced - An object containing the reduced data for the current index, including word prefix, count, and offsets array.
 * @param {number} nTotalRows - The total number of lines/rows in the table.
 * @param {object} wordsFrequency - A container element to hold all tables representing word frequencies.
 */
const insertCurrentTable = (i, iReduced, nTotalRows, wordsFrequency) => {
    let currentTableWordsFreq = document.createElement("table")
    currentTableWordsFreq.setAttribute("class", "border-black")
    currentTableWordsFreq.setAttribute("id", `id-table-${i}-nth`)
    currentTableWordsFreq.setAttribute("aria-label", `id-table-${i}-nth`)

    let currentCaption = currentTableWordsFreq.createCaption()
    currentCaption.setAttribute("aria-label", `id-table-${i}-caption`)
    currentCaption.innerText = `${iReduced["word_prefix"]}: ${iReduced["count"]} repetitions`

    let currentTHead = document.createElement("thead")
    let currentTHeadRow = currentTHead.insertRow()
    currentTHeadRow.insertCell().textContent = 'word'
    currentTHeadRow.insertCell().textContent = 'row nth'
    currentTHeadRow.insertCell().textContent = 'offsets'

    let currentTBody = document.createElement("tbody")
    let offsetsArray = iReduced.offsets_array
    for (let ii = 0; ii < offsetsArray.length; ii++) {
        insertCellIntoTRow(currentTBody, i, ii, offsetsArray[ii], nTotalRows)
    }
    currentTableWordsFreq.appendChild(currentTHead)
    currentTableWordsFreq.appendChild(currentTBody)
    wordsFrequency.appendChild(currentTableWordsFreq)
}

/**
 * Inserts a new table row into the specified tbody with an associated click event listener.
 *
 * @param {HTMLTableSectionElement} currentTBody - The tbody element where the new row will be inserted.
 * @param {number} i - A reference number for the parent's position in the DOM (needed for adding unique HTML id/aria-labels).
 * @param {number} ii - A counter of how many lines/rows have been added to the table (needed for adding unique HTML id/aria-labels).
 * @param {object} nthOffset - An object containing information about a single offset word, including its row number and word text.
 * @param {number} nTotalRows - The total number of lines/rows in the table.
 */
const insertCellIntoTRow = (currentTBody, i, ii, nthOffset, nTotalRows) => {
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
            oldClassElement[0].className = underlinedPrimary
        } catch {
            console.log("first click...")
        }
        currentUrl.className = underlinedClicked
    })
    currentUrl.className = underlinedPrimary
    currentUrl.innerText = nthOffset["word"]
    currentCell.appendChild(currentUrl)
    nthRowBody.insertCell().textContent = nthOffset["n_row"]
    nthRowBody.insertCell().textContent = nthOffset["offsets"]
}