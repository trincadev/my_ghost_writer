const wordsFrequencyTableTitleText = "Words Frequency Table"
let wfo = {
    "words_frequency": {},
    "nTotalRows": null
}
const editorFieldLabel = "editor"
const underlinedPrimary = "underlinedBlue"
const underlinedClicked = "underlinedDarkViolet"

const stemmer = (function(){
    let step2list = {
            "ational" : "ate",
            "tional" : "tion",
            "enci" : "ence",
            "anci" : "ance",
            "izer" : "ize",
            "bli" : "ble",
            "alli" : "al",
            "entli" : "ent",
            "eli" : "e",
            "ousli" : "ous",
            "ization" : "ize",
            "ation" : "ate",
            "ator" : "ate",
            "alism" : "al",
            "iveness" : "ive",
            "fulness" : "ful",
            "ousness" : "ous",
            "aliti" : "al",
            "iviti" : "ive",
            "biliti" : "ble",
            "logi" : "log"
        },

        step3list = {
            "icate" : "ic",
            "ative" : "",
            "alize" : "al",
            "iciti" : "ic",
            "ical" : "ic",
            "ful" : "",
            "ness" : ""
        },

        c = "[^aeiou]",          // consonant
        v = "[aeiouy]",          // vowel
        C = c + "[^aeiouy]*",    // consonant sequence
        V = v + "[aeiou]*",      // vowel sequence

        mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
        meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
        mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
        s_v = "^(" + C + ")?" + v;                   // vowel in stem

    return function (w) {
        let stem,
            suffix,
            firstch,
            re,
            re2,
            re3,
            re4,
            origword = w;

        if (w.length < 3) { return w; }

        firstch = w.substr(0,1);
        if (firstch == "y") {
            w = firstch.toUpperCase() + w.substr(1);
        }

        // Step 1a
        re = /^(.+?)(ss|i)es$/;
        re2 = /^(.+?)([^s])s$/;

        if (re.test(w)) { w = w.replace(re,"$1$2"); }
        else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }

        // Step 1b
        re = /^(.+?)eed$/;
        re2 = /^(.+?)(ed|ing)$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            re = new RegExp(mgr0);
            if (re.test(fp[1])) {
                re = /.$/;
                w = w.replace(re,"");
            }
        } else if (re2.test(w)) {
            let fp = re2.exec(w);
            stem = fp[1];
            re2 = new RegExp(s_v);
            if (re2.test(stem)) {
                w = stem;
                re2 = /(at|bl|iz)$/;
                re3 = new RegExp("([^aeiouylsz])\\1$");
                re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
                if (re2.test(w)) {	w = w + "e"; }
                else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
                else if (re4.test(w)) { w = w + "e"; }
            }
        }

        // Step 1c
        re = /^(.+?)y$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(s_v);
            if (re.test(stem)) { w = stem + "i"; }
        }

        // Step 2
        re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step2list[suffix];
            }
        }

        // Step 3
        re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step3list[suffix];
            }
        }

        // Step 4
        re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
        re2 = /^(.+?)(s|t)(ion)$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            if (re.test(stem)) {
                w = stem;
            }
        } else if (re2.test(w)) {
            let fp = re2.exec(w);
            stem = fp[1] + fp[2];
            re2 = new RegExp(mgr1);
            if (re2.test(stem)) {
                w = stem;
            }
        }

        // Step 5
        re = /^(.+?)e$/;
        if (re.test(w)) {
            let fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            re2 = new RegExp(meq1);
            re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
            if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
                w = stem;
            }
        }

        re = /ll$/;
        re2 = new RegExp(mgr1);
        if (re.test(w) && re2.test(w)) {
            re = /.$/;
            w = w.replace(re,"");
        }

        // and turn initial Y back to y
        if (firstch == "y") {
            w = firstch.toLowerCase() + w.substr(1);
        }

        return w;
    }
})();
function filterElementsFromList (inputArray,  filterWhitespaces = false, filterArgs=["", " "]) {
    if (filterWhitespaces) {
        inputArray = inputArray.filter(e => String(e).trim());
    }
    return inputArray.filter((x) => !filterArgs.includes(x));
}
function customTokenize(s, pattern = /([A-Za-zÀ-ÿ-]+|[0-9._]+|.|!|\?|'|"|:|;|,|-)/i, filterWhitespaces=true) {
    const results = s.split(pattern)
    return filterElementsFromList(results, filterWhitespaces)
}

/**
 * Applies Porter Stemmer algorithm to reduce words in a given text to their base form,
 * then produces a dictionary of word frequencies with, for every recognized base form,
 * a list of these repeated words with their position.
 *
 * @param {string} text - Input string containing the text to be stemmed.
 * @returns {Object} - An object containing the number of processed rows and the words frequency dictionary.
 */
function textStemming(text) {
    const textSplitNewline = text.split('\n');
    const rowWordsTokens = [];
    const rowOffsetsTokens = [];

    textSplitNewline.forEach((row, rowIndex) => {
        const tokens = customTokenize(row);
        const offsets = getOffsets(row, tokens);
        rowWordsTokens.push(tokens);
        rowOffsetsTokens.push(offsets);
    });

    const wordsStemsDict = getWordsTokensAndIndexes(rowWordsTokens, rowOffsetsTokens);
    const nTotalRows = textSplitNewline.length;

    return { nTotalRows, wordsStemsDict };
}

/**
 * Get the words tokens and their indexes in the text.
 *
 * @param {Array<Array<string>>} wordsTokensList - List of words tokens.
 * @param {Array<Array<Object>>} offsetsTokensList - List of offsets for each token.
 * @param {number} [minLenWords=3] - Minimum length of words to include.
 * @returns {Object} - Dictionary with stemmed words as keys and a list of dictionaries
 *                     containing the original word and its offsets as values.
 */
function getWordsTokensAndIndexes(wordsTokensList, offsetsTokensList, minLenWords = 3) {
    const wordsStemsDict = {};

    wordsTokensList.forEach((wordsTokens, nRow) => {
        wordsTokens.forEach((word, index) => {
            const cleanedWord = cleanString(word);
            if (cleanedWord.length < minLenWords) return;

            // const stem = ps.stem(cleanedWord);
            const stem = stemmer(cleanedWord);
            if (!wordsStemsDict[stem]) {
                wordsStemsDict[stem] = { count: 0, word_prefix: stem, offsets_array: [] };
            }

            const offsets = offsetsTokensList[nRow][index];
            updateStemsList(wordsStemsDict[stem], word, offsets, nRow);
        });
    });

    return wordsStemsDict;
}

/**
 * Update the stems list with the new stem and its count.
 *
 * @param {Object} currentStemObj - Object containing the current stem count and list of words.
 * @param {string} word - The word to stem.
 * @param {Object} offsets - Object containing the start and end offsets of the word.
 * @param {number} nRow - The row number in the original text.
 */
function updateStemsList(currentStemObj, word, offsets, nRow) {
    currentStemObj.count += 1;
    currentStemObj.offsets_array.push({
        word,
        offsets: [offsets.start, offsets.end], // Convert offsets to an array format
        n_row: nRow
    });
}

/**
 * Clean a given string by removing punctuation and converting it to lowercase.
 *
 * @param {string} s - The string to clean.
 * @returns {string} - The cleaned string.
 */
function cleanString(s) {
    return s.replace(/[^\w\s]|_/g, '').replace(/\s+/g, '').toLowerCase();
}

/**
 * Get the offsets of each token in the original text.
 *
 * @param {string} text - The original text.
 * @param {Array<string>} tokens - The tokens extracted from the text.
 * @returns {Array<Object>} - Array of objects containing the start and end offsets of each token.
 */
function getOffsets(text, tokens) {
    const offsets = [];
    let currentIndex = 0;

    tokens.forEach(token => {
        const start = text.indexOf(token, currentIndex);
        const end = start + token.length;
        offsets.push({ start, end });
        currentIndex = end;
    });

    return offsets;
}

/**
 * Retrieves the value of a form field by its key from a FormData object.
 *
 * @param {string} formId - The ID of the HTML form element that contains the field.
 * @param {string} key - The name attribute of the form field to retrieve.
 * @returns {*} The value of the form field, or null if it does not exist in the FormData object.
 */
function getFormDataByKey(formId, key) {
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
function previewFile() {
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
function scrollToGivenPoint(editorElement, line, nTotalRows, negativeOffsetPerc=0.12) {
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
function setCaret(line, offsetColumn, nTotalRows, negativeOffsetPerc=0.12) {
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

function parseWebserverDomain () {
    const remoteWebServer = document.getElementById("id-input-webserver")
    console.log("remoteWebServer", remoteWebServer, "#")
    const remoteWebServerValue = remoteWebServer.value || "http://localhost:7860"
    console.log("remoteWebServerValue:", remoteWebServerValue, "#")
    const remoteWebServerDomain = remoteWebServerValue.trim().replace(/\/$/, '')
    return `${remoteWebServerDomain}/words-frequency`
}

/**
 * Fetches words frequency data from the server and populates the words frequency tables.
 * 
 * @async
 * @function getWordsFrequency
 */
async function getWordsFrequency() {
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
    const useEmbeddedStemmer = document.getElementById('id-stemmer-embedded')
    const useEmbeddedStemmerValue = useEmbeddedStemmer.checked || false
    console.log("useEmbeddedStemmer", useEmbeddedStemmer, ", useEmbeddedStemmerValue:", useEmbeddedStemmerValue, "#")
    if (useEmbeddedStemmerValue) {
        console.log("useEmbeddedStemmer...")
        try {
            const bodyResponseJson = textStemming(text.innerText)
            setElementCssClass("waiting-for-be", "display-none")
            let freq = bodyResponseJson["wordsStemsDict"]
            let nTotalRows = bodyResponseJson["nTotalRows"]
            console.log(`getWordsFreq::nTotalRows: '${nTotalRows}', populateWordsFrequencyTables...`)
            populateWordsFrequencyTables(freq, nTotalRows)
        } catch (err) {
            console.log("bodyResponseJson", typeof bodyResponseJson, ", keys:", bodyResponseJson.keys(), "#")
            console.error("getWordsFrequency::err on useEmbeddedStemmer:", err, "#")
            setElementCssClass("waiting-for-be", "display-none")
            setElementCssClass("waiting-for-be-error", "display-block")

        }
    } else {
        console.log("else, use the default webserver...")
        const wordsFrequencyURL = parseWebserverDomain()
        try {
            let response = await fetch(wordsFrequencyURL, {
                method: "POST",
                body: JSON.stringify(bodyRequest)
            })
            console.assert(response.status, 200)
            let bodyResponseJson = await response.json()
            setElementCssClass("waiting-for-be", "display-none")
            let freq = bodyResponseJson["words_frequency"]
            let nTotalRows = bodyResponseJson["n_total_rows"]
            console.log(`getWordsFreq::nTotalRows: '${nTotalRows}'`)
            populateWordsFrequencyTables(freq, nTotalRows)
        } catch (err) {
            console.error("getWordsFrequency::err on webserver request/response:", err, "#")
            console.log(`wordsFrequencyURL:`, typeof wordsFrequency, "=>", wordsFrequencyURL, "#")
            setElementCssClass("waiting-for-be", "display-none")
            setElementCssClass("waiting-for-be-error", "display-block")
        }
    }
}

/**
 * Returns a sorting function for the given property and order.
 *
 * @param {string} property - The property to sort by.
 * @param {string} order - The order of sorting ('asc' or 'desc').
 * @returns {function} A comparison function that sorts data in the specified order.
 */
function dynamicSort(property, order) {
    let sort_order = order === "desc" ? -1 : 1
    return function (a, b){
        // a should come before b in the sorted order
        if(a[property] < b[property]){
            return -1 * sort_order;
        // a should come after b in the sorted order
        }else if(a[property] > b[property]){
            return 1 * sort_order;
        // a and b are the same
        }
        return 0 * sort_order;
    }
}

/**
 * This function filters an array based on a property key and the value to use for filter.
 *
 * @description
 *   The function iterates over each element in the array.
 *   If the element's value for the specified key matches the search value (it's included, case-insensitive), it is added to the new array.
 *
 * @param {array} arr - The array to filter.
 * @param {string} key - The property key to match against.
 * @param {string} value - The value to search for in the array elements.
 * @returns {array} A new array containing only the elements that match the specified value.
 */
function arrayFilter(arr, key, value) {
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

/**
 * Updates the words frequency tables with new data.
 *
 * @description
 *   This function is called whenever a change in form input fields or the uploaded text file affects the words frequency table's content.
 *   It sorts and filters the word groups based on user preferences, and updates the HTML elements containing these tables.
 *
 * @async
 * @function updateWordsFrequencyTables
 */
async function updateWordsFrequencyTables() {
    let nTotalRows = wfo["nTotalRows"]
    if (nTotalRows === null || nTotalRows < 1) {
        alert("let's get some data before updating the result table...")
    }

    let _wfo = wfo["words_frequency"]
    let reduced = Object.values(_wfo)
    let order = getFormDataByKey("id-form-order-by", "order")
    let sort = getFormDataByKey("id-form-sort-by", "sort")
    reduced.sort(dynamicSort(sort, order))

    let inputFilter = document.getElementById("filter-words-frequency")
    let inputFilterValue = inputFilter.value
    if (inputFilterValue != undefined && inputFilter.value !== "") {
        reduced = arrayFilter(reduced, "word_prefix", inputFilterValue)
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
function populateWordsFrequencyTables(wordsFrequencyObj, nTotalRows) {
    wfo["words_frequency"] = wordsFrequencyObj
    if (typeof wordsFrequencyObj === "string") {
        wfo["words_frequency"] = JSON.parse(wordsFrequencyObj)
    }
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
function insertCurrentTable(i, iReduced, nTotalRows, wordsFrequency) {
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
function insertCellIntoTRow(currentTBody, i, ii, nthOffset, nTotalRows) {
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