const wordsFrequencyTableTitleText = "Words Freq. Stats"
const wordsFrequencyTableTitleMobileText = "Words Freq. Stats"
let wfo = {
    "words_frequency": {},
    "nTotalRows": null,
    "rowArray": []
}
const editorFieldLabel = "editor"
const remoteWebServer = "http://localhost:7860"
const underlinedPrimary = "underlinedBlue"
const underlinedClicked = "underlinedDarkViolet"
const underlinedPrimaryTable = "underlinedBlueTable"
const underlinedClickedTable = "underlinedDarkVioletTable"
const objectChildNodeNamesToParse = {
    "#text": "textContent",
    "SPAN": "textContent"
}
const mobileInnerSize = 767
const minNCharsMore = 10

/**
 * Object containing functions for word frequency analysis.
 *
 * @property {function} 'id-input-webserver-wordfreq-checkbox' - Analyzes input text using webserver API.
 * @property {function} 'stemmer-embedded' - Analyzes input text using embedded functionality.
 */
const wordsFrequencyAnalyzers = {
    /**
     * Analyzes input text using 'My Ghost Writer' webserver API.
     *
     * @param {Array<Object>} arrayOfValidTextChildWithNrow - Array of objects representing text rows to analyze.
     * @returns {Promise<void>} Populates the frequency tables with the response from the webserver.
     */
    "id-input-webserver-wordfreq-checkbox": async function(arrayOfValidTextChildWithNrow) {
        let bodyRequest = {"text": arrayOfValidTextChildWithNrow}
        console.log("use the webserver for word freq analysis...")
        const wordsFrequencyURL = parseWebserverDomain()
        try {
            let response = await fetch(wordsFrequencyURL, {
                method: "POST",
                body: JSON.stringify(bodyRequest)
            })
            console.assert(response.status === 200, `response.status: ${response.status}!`)
            let bodyResponseJson = await response.json()
            setElementCssClassById("waiting-for-be", "display-none")
            let freq = bodyResponseJson["words_frequency"]
            let nTotalRows = bodyResponseJson["n_total_rows"]
            console.log(`wordsFrequencyAnalyzers::nTotalRows: '${nTotalRows}'`)
            populateWordsFrequencyTables(freq, nTotalRows, arrayOfValidTextChildWithNrow)
        } catch (err) {
            console.error("wordsFrequencyAnalyzers::err on webserver request/response:", err, "#")
            console.log(`wordsFrequencyAnalyzers::wordsFrequencyURL: ${typeof wordsFrequencyURL}:`, wordsFrequencyURL, "#")
            setElementCssClassById("waiting-for-be", "display-none")
            setElementCssClassById("waiting-for-be-error", "display-block")
        }
    },
    /**
     * Analyzes input text using embedded functionality.
     *
     * @param {Array<Object>} inputText - Array of objects representing text rows to analyze.
     * @returns {void} Populates the frequency tables with the embedded analysis.
     */
    'stemmer-embedded': function(inputText) {
        console.log("use the embedded functionality for word freq analysis...")
        try {
            const bodyResponseJson = textStemming(inputText)
            setElementCssClassById("waiting-for-be", "display-none")
            let freq = bodyResponseJson["wordsStemsDict"]
            let nTotalRows = bodyResponseJson["nTotalRows"]
            console.log(`getWordsFreq::nTotalRows: '${nTotalRows}', populateWordsFrequencyTables...`)
            populateWordsFrequencyTables(freq, nTotalRows, inputText)
            // temp until we have the new UI
            let hiddenOutputSpan = document.getElementById("id-hidden-editor")
            hiddenOutputSpan.textContent = JSON.stringify(freq, null, 2)
        } catch (err) {
            console.error("getWordsFrequency::err on useWordfreqWebserver:", err, "#")
            setElementCssClassById("waiting-for-be", "display-none")
            setElementCssClassById("waiting-for-be-error", "display-block")
        }
    }
}

// lunr.stemmer
// Copyright (C) 2020 Oliver Nightingale, Code included under the MIT license
// Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
const porterStemmer = (function(){
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
        if (firstch === "y") {
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
        if (firstch === "y") {
            w = firstch.toLowerCase() + w.substr(1);
        }

        return w;
    }
})();

/**
 * Filters elements from an array based on specified conditions.
 * @param {Array} inputArray - The array of elements to filter.
 * @param {boolean} [filterWhitespaces=false] - Whether to remove elements that are only whitespace.
 * @param {Array<string>} [filterArgs=["", " "]] - List of elements to exclude from the array.
 * @returns {Array} - The filtered array.
 */
function filterElementsFromList(inputArray,  filterWhitespaces = false, filterArgs=["", " "]) {
    if (filterWhitespaces) {
        inputArray = inputArray.filter(e => String(e).trim());
    }
    return inputArray.filter((x) => !filterArgs.includes(x));
}

/**
 * Tokenizes a string using a custom pattern and filters out specified elements.
 * @param {string} s - The input string to tokenize.
 * @param {RegExp} [pattern=/([A-Za-zÀ-ÿ-]+|[0-9._]+|.|!|\?|'|"|:|;|,|-)/i] - The regex pattern for tokenization.
 * @param {boolean} [filterWhitespaces=true] - Whether to remove whitespace elements after tokenization.
 * @returns {Array<string>} - The list of tokens filtered based on specified conditions.
 */
function customWordPunctTokenize(s, pattern = /([A-Za-zÀ-ÿ-]+|[0-9._]+|.|!|\?|'|"|:|;|,|-)/i, filterWhitespaces=true) {
    const results = s.split(pattern)
    return filterElementsFromList(results, filterWhitespaces)
}

/**
 * Applies Porter Stemmer algorithm to reduce words in a given text to their base form,
 * then produces a dictionary of word frequencies with, for every recognized base form,
 * a list of these repeated words with their position.
 *
 * Handles nested SPAN childNodes and tracks idxRow, idxRowChild, idxRowParent.
 *
 * @param {Array<Object>} textSplitNewline - Array of objects: {idxRow, text, idxRowChild, idxRowParent}
 * @returns {Object} - { nTotalRows, wordsStemsDict }
 */
function textStemming(textSplitNewline) {
    // textSplitNewline: [{idxRow: number, text: string, idxRowChild: number|null, idxRowParent: number|null}]
    const wordsStemsDict = {};
    let nTotalRows = textSplitNewline.length;

    textSplitNewline.forEach((data) => {
        const row = data.text;
        const idxRow = data.idxRow;
        const idxRowChild = data.idxRowChild ?? null;
        const idxRowParent = data.idxRowParent ?? null;
        const tokens = customWordPunctTokenize(row);
        const offsets = getOffsets(row, tokens);

        tokens.forEach((word, i) => {
            const wordLower = word.toLowerCase();
            const stem = porterStemmer(wordLower);
            if (!wordsStemsDict[stem]) {
                wordsStemsDict[stem] = { count: 0, word_prefix: stem, offsets_array: [] };
            }
            wordsStemsDict[stem].count += 1;
            wordsStemsDict[stem].offsets_array.push({
                word: word, // keep original casing for display
                offsets: [offsets[i].start, offsets[i].end],
                n_row: idxRow,
                n_row_child: idxRowChild,
                n_row_parent: idxRowParent
            });
        });
    });
    return { nTotalRows, wordsStemsDict };
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
 * Scrolls to the specified point within an element.
 *
 * @param {HTMLElement} editorElement - The target element to scroll.
 * @param {number} yClientOffset - The offset from the top of the element to scroll to.
 * @param {number} [negativeMultiplierFontSize=3] - Multiplier for font size adjustment.
 */
function scrollToGivenPoint(editorElement, yClientOffset, negativeMultiplierFontSize = 3) {
    const editorComputedStyle = window.getComputedStyle(editorElement)
    const fontSize = parseInt(editorComputedStyle.getPropertyValue("font-size"), 10)
    const negativeOffset = fontSize * negativeMultiplierFontSize
    const scrollHeight = editorElement.scrollHeight
    if (yClientOffset < (scrollHeight - negativeOffset)) {
        yClientOffset -= negativeOffset
    }
    editorElement.scrollTo(0, yClientOffset)
}

/**
 * Scrolls the editor to a specified position and sets the caret at that point.
 *
 * @param {number} line - The line/row number (0-indexed) where the caret should be placed.
 * @param {Array<number>} offsetColumn - A number array containing two numbers representing the column offsets for the start and end of the selection range.
 * @param {number} nRowChild - The index of the child node (if applicable).
 * @param {number} nRowParent - The index of the parent node (if applicable).
 */
function setCaret(line, offsetColumn, nRowChild, nRowParent) {
    const editorElement = document.getElementById(editorFieldLabel)
    editorElement.scrollTo(0, 0) // workaround: first reset the scroll position moving it at editorElement beginning

    const childNodes = editorElement.childNodes
    let rng = document.createRange();
    let sel = window.getSelection();
    let col0 = offsetColumn[0]
    let col1 = offsetColumn[1]
    let childNode = childNodes[line]
    let subChildNode;
    /// handle case of childNodes not of type #text, e.g., SPAN
    if (nRowParent !== null) {
        console.assert(line === nRowParent, `line ${line} nth === parent line ${nRowParent} nth???`)
    }
    switch (childNode.nodeName) {
        case "#text":
            rng.setStart(childNode, col0)
            rng.setEnd(childNode, col1)
            break
        case "SPAN":
            subChildNode = childNode.childNodes[nRowChild]
            rng.setStart(subChildNode, col0)
            rng.setEnd(subChildNode, col1)
            break
        default:
            throw Error(`childNode.nodeName ${childNode.nodeName} not yet handled!`)
    }
    sel.removeAllRanges();
    sel.addRange(rng);
    editorElement.focus();

    const offsetsEditor = getOffsetsWithElement(editorElement)
    const yBase = offsetsEditor.top
    const {y} = getBoundingClientRect(rng)
    const yClientOffset = y - yBase

    scrollToGivenPoint(editorElement, yClientOffset)
}

/**
 * Gets the offsetTop and offsetHeight of an element.
 * @param {HTMLElement} el - The element to get offsets from.
 * @returns {Object} An object with 'top' and 'height' properties.
 */
function getOffsetsWithElement(el) {
    return {top: el.offsetTop, height: el.offsetHeight}
}

/**
 * Gets the bounding client rectangle of an element or range.
 * @param {HTMLElement|Range} el - The element or range to get bounding rect from.
 * @returns {Object} An object with x, y, bottom, and top properties.
 */
function getBoundingClientRect(el) {
    let bounds = el.getBoundingClientRect();
    return {x: bounds.left, y: bounds.y, bottom: bounds.bottom, top: bounds.top};
}

/**
 * Updates the CSS class of an HTML element with the specified ID.
 *
 * @param {string} elementId - The ID of the HTML element to update.
 * @param {string} currentClass - The new CSS class to apply to the element.
 */
function setElementCssClassById(elementId, currentClass) {
    let elementWithClassToChange = document.getElementById(elementId)
    elementWithClassToChange.setAttribute("class", currentClass)
}

/**
 * Sets a CSS class by replacing an old class.
 * @param {string} oldClassName - The old class name to replace.
 * @param {string} currentClass - The new class name to set.
 */
function setElementCssClassByOldClass(oldClassName, currentClass) {
    try {
        let oldClassElement = document.getElementsByClassName(oldClassName)
        oldClassElement[0].className = currentClass
    } catch {}
}

/**
 * Parses the web server domain from an input element and returns the full API endpoint.
 * @returns {string} The parsed web server domain with /words-frequency endpoint.
 */
function parseWebserverDomain () {
    const remoteWebServerEl = document.getElementById("id-input-webserver-wordfreq")
    console.log("remoteWebServer.value:", remoteWebServerEl.value, "#")
    const remoteWebServerValue = remoteWebServerEl.value ?? remoteWebServer
    const remoteWebServerDomain = remoteWebServerValue.trim().replace(/\/+$/, '')
    return `${remoteWebServerDomain}/words-frequency`
}

/**
 * Fetches words frequency data from the server and populates the words frequency tables.
 * The user can choose to use an embedded stemmer or a remote web server for processing.
 * 
 * @async
 * @function getWordsFrequency
 */
async function getWordsFrequency() {
    if (isMobile()) {
        toggleElementWithClassById('id-container-desktop-menu')
    }
    let {validChildContent} = getValidChildNodesFromEditorById(editorFieldLabel)
    setElementCssClassById("waiting-for-be-error", "display-none")
    setElementCssClassById("waiting-for-be", "display-block")
    let wordsFrequencyTableTitleEl = document.getElementById("id-words-frequency-table-title")
    let wordsFrequencyTableTitleElMobile = document.getElementById("id-words-frequency-table-title-mobile")

    wordsFrequencyTableTitleEl.innerText = wordsFrequencyTableTitleText
    wordsFrequencyTableTitleElMobile.innerText = wordsFrequencyTableTitleMobileText
    let listOfWords = document.getElementById("id-list-of-words")
    listOfWords.innerHTML = ""
    let currentTableOfWords = document.getElementById("id-current-table-of-words")
    currentTableOfWords.innerHTML = ""
    let currentTableTitle = document.getElementById("id-current-table-of-words-title")
    currentTableTitle.innerText = ""
    const choiceWordFreqAnalyzerEl = document.getElementById('id-input-webserver-wordfreq-checkbox')
    console.log("choiceWordFreqAnalyzerEl checked:", typeof choiceWordFreqAnalyzerEl.checked, choiceWordFreqAnalyzerEl.checked, "#")
    switch (choiceWordFreqAnalyzerEl.checked) {
        case true: // webserver
            await wordsFrequencyAnalyzers['id-input-webserver-wordfreq-checkbox'](validChildContent)
            break;
        case false: // embedded
            wordsFrequencyAnalyzers['stemmer-embedded'](validChildContent)
            break;
        default:
            console.warn("No valid analyzer selected.");
            break;
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
 * Recursively extracts all string values from any level of a nested object or array.
 *
 * Traverses the input (object, array, or primitive) and collects every string value found.
 * The result is a flat array of all string values found within the input.
 *
 * @param {*} obj - The input object, array, or value to search for strings.
 * @returns {Array<string>} An array containing all string values found in the input.
 */
function extractStringValues(obj) {
    let result = [];
    if (typeof obj === "string") {
        result.push(obj);
    } else if (Array.isArray(obj)) {
        for (const item of obj) {
            result = result.concat(extractStringValues(item));
        }
    } else if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
            result = result.concat(extractStringValues(obj[key]));
        }
    }
    return result;
}

/**
 * Filters an array of objects by checking if a specified value exists within any nested property.
 * The search is case-insensitive and recursively collects all string values from each object,
 * then checks if the concatenated string contains the search value.
 *
 * @param {Array<Object>} array - The array of objects to filter.
 * @param {string} nestedValue - The value to search for within the objects.
 * @returns {Array<Object>} - A new array containing objects where the nested value is found.
 */
function arrayFilterNestedValue(array, nestedValue) {
    return array.filter(item => {
        let valuesFromObject = extractStringValues(item).join(" ")
        return valuesFromObject.toLowerCase().includes(nestedValue.toLowerCase());
    });
}

/**
 * Updates the words frequency tables with new data.
 *
 * Called whenever a change in form input fields or the uploaded text file affects the word frequency table's content.
 * Sorts and filters the word groups based on user preferences, and updates the HTML elements containing these tables.
 *
 * @function updateWordsFrequencyTables
 */
function updateWordsFrequencyTables() {
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
    if (inputFilterValue !== undefined && inputFilter.value !== "") {
        reduced = arrayFilterNestedValue(reduced, inputFilterValue)
    }

    let listOfWords = document.getElementById("id-list-of-words")
    listOfWords.innerHTML = ""
    let currentTableOfWords = document.getElementById("id-current-table-of-words")
    currentTableOfWords.innerHTML = ""

    let wordsFrequencyTableTitleEl = document.getElementById("id-words-frequency-table-title")
    wordsFrequencyTableTitleEl.innerText = `${wordsFrequencyTableTitleText} (${reduced.length} word groups, ${nTotalRows} rows)`
    let wordsFrequencyTableTitleMobileEl = document.getElementById("id-words-frequency-table-title-mobile")
    wordsFrequencyTableTitleMobileEl.innerText = `${wordsFrequencyTableTitleMobileText} (${reduced.length} word groups, ${nTotalRows} rows)`

    const wordListElement = document.createElement("list")
    for (let i=0; i<reduced.length; i++ ) {
        insertListOfWords(i, reduced[i], wordListElement, currentTableOfWords);
    }
    listOfWords.append(wordListElement)
}

/**
 * Populate the word frequency tables in the UI with data from the provided object or JSON string.
 *
 * @param {Object|string} wordsFrequencyObj - The object or JSON string containing word frequencies.
 * @param {number} nTotalRows - The total number of lines/rows to display for each word group.
 * @param rowArray - An array of objects representing the rows of text, each containing the text and its corresponding index.
 */
function populateWordsFrequencyTables(wordsFrequencyObj, nTotalRows, rowArray) {
    wfo["words_frequency"] = wordsFrequencyObj
    if (typeof wordsFrequencyObj === "string") {
        wfo["words_frequency"] = JSON.parse(wordsFrequencyObj)
    }
    wfo["nTotalRows"] = nTotalRows
    wfo["rowArray"] = Object.values(rowArray)
    updateWordsFrequencyTables()
}

function getRepetitionsText(iReduced) {
    return isMobile() || isMobilePortrait() ? `${iReduced["word_prefix"]}: ${iReduced["count"]} reps.` : `${iReduced["word_prefix"]}: ${iReduced["count"]} repetitions`
}

/**
 * Inserts a table into the DOM displaying the frequency of word prefixes and their corresponding row nths and offsets.
 *
 * @param {number} i - The current index being processed (needed for adding unique HTML id/aria-labels).
 * @param {Object} iReduced - An object containing the reduced data for the current index, including word prefix, count, and offsets array.
 * @param {HTMLElement} currentTableOfWords - A container element to hold the current table representing chosen word positions.
 */
function insertCurrentTable(i, iReduced, currentTableOfWords) {
    let currentTableWordsFreq = document.createElement("table")
    currentTableWordsFreq.setAttribute("class", "border-black")
    currentTableWordsFreq.setAttribute("id", `id-table-${i}-nth`)
    currentTableWordsFreq.setAttribute("aria-label", `id-table-${i}-nth`)

    // let currentCaption = currentTableWordsFreq.createCaption()
    // currentCaption.setAttribute("aria-label", `id-table-${i}-caption`
    const titleCurrentTable = document.getElementById("id-current-table-of-words-title")
    titleCurrentTable.innerText = getRepetitionsText(iReduced)
    let currentTBody = document.createElement("tbody")
    let offsetsArray = iReduced.offsets_array
    for (let ii = 0; ii < offsetsArray.length; ii++) {
        insertCellIntoTRow(currentTBody, i, ii, offsetsArray[ii])
    }
    currentTableWordsFreq.appendChild(currentTBody)

    // Wrap the table in a scrollable container
    let scrollableDiv = document.createElement("div")
    scrollableDiv.className = "scrollable-table-container"
    scrollableDiv.appendChild(currentTableWordsFreq)
    currentTableOfWords.appendChild(scrollableDiv)
}

/**
 * Inserts a list of words into a word list element based on the current table of words.
 * @param {number} i - The index of the current row.
 * @param {Object} iReduced - An object containing information about the current word prefix and count.
 * @param {HTMLElement} wordListElement - The element to insert the list of words into.
 * @param {HTMLElement} currentTableOfWords - The element to insert the current table of words into.
 */
function insertListOfWords(i, iReduced, wordListElement, currentTableOfWords) {
    const li = document.createElement("li");
    const a = document.createElement("a")
    a.innerText = getRepetitionsText(iReduced)
    a.addEventListener("click",  function() {
        currentTableOfWords.innerHTML = ""
        console.log(`insertListOfWords::'a', ${iReduced["word_prefix"]}: ${iReduced["count"]} repetitions`)
        insertCurrentTable(i, iReduced, currentTableOfWords)
        setElementCssClassByOldClass(underlinedClicked, underlinedPrimary)
        a.className = underlinedClicked
        console.log("insertListOfWords::click event:", isMobilePortrait(), "#")
        if(isMobilePortrait()) {
            gotoCurrentTableOfWords()
        }
    });
    a.className = underlinedPrimary
    li.appendChild(a);
    wordListElement.appendChild(li);
}

/**
 * Inserts a new table row into the specified tbody with an associated click event listener.
 *
 * @param {HTMLTableSectionElement} currentTBody - The tbody element where the new row will be inserted.
 * @param {number} i - A reference number for the parent's position in the DOM (needed for adding unique HTML id/aria-labels).
 * @param {number} ii - A counter of how many lines/rows have been added to the table (needed for adding unique HTML id/aria-labels).
 * @param {Object} nthOffset - An object containing information about a single offset word, including its row number and word text.
 */
function insertCellIntoTRow(currentTBody, i, ii, nthOffset) {
    let rowArray = wfo["rowArray"]
    let nthRowBody = currentTBody.insertRow()
    nthRowBody.setAttribute("id", `id-table-${i}-row-${ii}-nth`)
    nthRowBody.setAttribute("aria-label", `id-table-${i}-row-${ii}-nth`)
    const nthRowIdx = nthOffset["n_row"]
    let currentCell = nthRowBody.insertCell()
    let currentUrl = document.createElement("a")
    currentUrl.addEventListener("click", function() {
        let nRow = nthRowIdx
        let nRowChild = nthOffset["n_row_child"]
        let nRowParent = nthOffset["n_row_parent"]
        let offsetWord = nthOffset["offsets"]
        setCaret(nRow, offsetWord, nRowChild, nRowParent)
        setElementCssClassByOldClass(underlinedClickedTable, underlinedPrimaryTable)
        currentUrl.className = underlinedClickedTable
    })
    currentUrl.className = underlinedPrimary
    const wfoContainerWidth = getStylePropertyById("id-col2-words-frequency", "width", "int")
    const listOfWordsWidth = getStylePropertyById("id-list-of-words", "width", "int")
    const sentencesContainerWidth = wfoContainerWidth - listOfWordsWidth
    let nCharsMore = Math.floor(sentencesContainerWidth / 20)
    if (nCharsMore < minNCharsMore) {
        nCharsMore = minNCharsMore
    }
    console.log(`insertCellIntoTRow::sentencesContainerWidth: ${sentencesContainerWidth}px, nCharsMore: ${nCharsMore}.`)
    const {substring0, substringWord, substring2} = getSubstringForTextWithGivenOffset(rowArray, nthRowIdx, nthOffset, nCharsMore)

    const span0 = document.createElement("span").innerText = substring0
    const spanWord = document.createElement("span")
    spanWord.setAttribute("class", "font-weight-bold")
    spanWord.innerText = substringWord
    const span2 = document.createElement("span").innerText = substring2
    currentUrl.append(span0)
    currentUrl.append(spanWord)
    currentUrl.append(span2)
    currentCell.appendChild(currentUrl)
}

/** Given a rowArray (array of objects) and an nthOffset (object), it returns an object containing three substrings:
 * - substring0: the substring before the sliced word
 * - substringWord: the word sliced from the text with the given offset from the nthOffset arg
 * - substring2: the substring after the sliced word
 *
 * @param {Array} rowArray - The array of objects containing text and their corresponding indices.
 * @param {number} nthRowIdx - The index of the row to process.
 * @param {Object} nthOffset - The object containing the offsets and other properties of the word.
 * @param {number} [nCharsMore=30] - The number of characters to include before and after the selected word.
 *
 * @returns {Object} - An object containing the substring before, the selected word, and the substring after.
 * */
function getSubstringForTextWithGivenOffset(rowArray, nthRowIdx, nthOffset, nCharsMore = 30) {
    try {
        const currentRowArr = rowArray.filter(item => {
            if (item.idxRowChild !== null) {
                return item.idxRow === nthRowIdx && item.idxRowChild === nthOffset["n_row_child"] && item.idxRowParent === nthOffset["n_row_parent"]
            }
            return item.idxRow === nthRowIdx
        })
        const currentRow = currentRowArr[0]
        const text = currentRow.text
        let offset = nthOffset["offsets"]
        let start = offset[0]
        let end = offset[1]
        let currentWord = nthOffset["word"]
        let startOffset = Math.max(0, start - nCharsMore)
        let endOffset = Math.min(text.length, end + nCharsMore)
        let substringWord = text.substring(start, end)

        // Prune incomplete word at the start
        let substring0 = text.substring(startOffset, start)
        substring0 = substring0.replace(/^\S*\s?/, '') // remove partial word at the start

        // Prune incomplete word at the end
        let substring2 = text.substring(end, endOffset)
        substring2 = substring2.replace(/\s?\S*$/, '') // remove partial word at the end

        // Rebuild substring for validation
        let substring = substring0 + substringWord + substring2

        if (substringWord !== currentWord || substring !== substring0 + substringWord + substring2) {
            console.assert(substringWord === currentWord,
                `text.substring(${start}, ${end}) !== currentWord: '${substringWord}', '${currentWord}'.`
            )
            console.assert(substring === substring0 + substringWord + substring2,
                `## text.substring(${startOffset}, ${endOffset}) !== text.substring(${startOffset}, ${start}) + currentWord + text.substring(${end}, ${endOffset}).`
            )
            throw Error(`text.substring(${start}, ${end}): (${substringWord}) !== currentWord (${currentWord}).`)
        }
        return {substring0, substringWord, substring2};
    } catch (e) {
        console.error(`getSubstringForTextWithGivenOffset::error:`, e, ` #`)
        throw e
    }
}

/** Get the value of a CSS property for an element by its ID.
 *
 * @param {string} id - The ID of the element.
 * @param {string} property - The CSS property to retrieve.
 * @param {string} [parsing=""] - Optional parsing type ("int", "float").
 *
 * returns {string|number} - The value of the CSS property, parsed if specified.
 * */
function getStylePropertyById(id, property, parsing="") {
    const element = document.getElementById(id)
    return getStylePropertyWithElement(element, property, parsing)
}

/** Get the value of a CSS property for a given element.
 *
 * @param {HTMLElement} element - The element to retrieve the property from.
 * @param {string} property - The CSS property to retrieve.
 * @param {string} [parsing=""] - Optional parsing type ("int", "float").
 *
 * returns {string|number} - The value of the CSS property, parsed if specified.
 * */
function getStylePropertyWithElement(element, property, parsing="") {
    const howToParse = {
        "int": parseInt,
        "float": parseFloat
    }
    const elementStyle = window.getComputedStyle(element)
    let value = elementStyle.getPropertyValue(property)
    if (howToParse[parsing] !== undefined) {
        value = howToParse[parsing](value, 10)
    }
    return value
}

/**
 * Updates the word frequency tables with new data if enter key is pressed.
 * If the event target has a value (i.e., it's an input field) and the event key is "Enter",
 * call the updateWordsFrequencyTables function to update the word frequency tables.
 *
 * @returns {void}
 */
function updateWordsFreqIfPressEnterSimple() {
    if(event.key==='Enter'){
        updateWordsFrequencyTables()
    }
}

/**
 * Retrieves valid child nodes from an editor element by ID.
 * Traverses the DOM structure of the editor and collects valid text content from text nodes and SPANs.
 * Handles nested SPANs and tracks their positions for later processing.
 *
 * @param {string} idElement - The ID of the editor element to retrieve child nodes from.
 * @returns {Object} An object containing arrays of valid child nodes and their corresponding content, as well as the editor element itself.
 */
function getValidChildNodesFromEditorById(idElement) {
    const editorElement = document.getElementById(idElement);
    let validChildContent = [];
    const validNodeNames = Object.keys(objectChildNodeNamesToParse);

    // Helper: check if a node has at least one valid child node with non-empty text.
    function hasValidChild(node) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (validNodeNames.includes(child.nodeName)) {
                const prop = objectChildNodeNamesToParse[child.nodeName];
                if (child[prop] && child[prop].trim() !== "") {
                    return true;
                }
            }
        }
        return false;
    }

    // Recursive helper function.
    // topIdx: index of the top-level child from the editor element.
    // childIdx: index within the parent node, or null if top-level.
    // parentId: for nested nodes, the top-level parent's index (from a SPAN); otherwise null.
    function processNode(node, topIdx, childIdx = null, parentId = null) {
        // For nodes that are not SPAN, push their text if valid.
        if (node.nodeName !== "SPAN" && validNodeNames.includes(node.nodeName)) {
            const textField = objectChildNodeNamesToParse[node.nodeName];
            const textContent = node[textField];
            if (textContent && textContent.trim() !== "") {
                validChildContent.push({
                    idxRow: topIdx,
                    text: textContent,
                    idxRowChild: childIdx,
                    idxRowParent: parentId
                });
            }
        }
        // For SPAN nodes, decide: if it has no valid child, then push its own text;
        // otherwise, rely on its children.
        if (node.nodeName === "SPAN") {
            if (!hasValidChild(node)) {
                const textField = objectChildNodeNamesToParse[node.nodeName];
                const textContent = node[textField];
                if (textContent && textContent.trim() !== "") {
                    validChildContent.push({
                        idxRow: topIdx,
                        text: textContent,
                        idxRowChild: childIdx,
                        idxRowParent: parentId
                    });
                }
            }
        }
        // Recurse into childNodes.
        if (node.childNodes && node.childNodes.length > 0) {
            let newParentId = parentId;
            if (node.nodeName === "SPAN") {
                newParentId = topIdx;  // for nested nodes, use parent's top-level index.
            }
            for (let i = 0; i < node.childNodes.length; i++) {
                processNode(node.childNodes[i], topIdx, i, newParentId);
            }
        }
    }

    // Process each top-level child node of the editor.
    for (let i = 0; i < editorElement.childNodes.length; i++) {
        processNode(editorElement.childNodes[i], i);
    }

    return { validChildContent, editorElement };
}

/** Needed by lite.koboldai.net */
function toggleElementWithClassById(idElement, className="collapse") {
    let elementWithClassToChange = document.getElementById(idElement)
    if (elementWithClassToChange.classList.contains(className)) {
        elementWithClassToChange.classList.remove(className);
    } else {
        elementWithClassToChange.classList.add(className);
    }
}

function addClassById(idElement, className) {
    let elementWithClassToChange = document.getElementById(idElement)
    elementWithClassToChange.classList.add(className);
}

function closeWordsFreqTopNav(idElement) {
    addClassById(idElement, "collapse")
}

function removeClassById(idElement, className) {
    let elementWithClassToChange = document.getElementById(idElement)
    elementWithClassToChange.classList.remove(className);
}

function toggleOrCloseByBoolAndId(idElement, boolFlag, className="collapse") {
    switch (boolFlag) {
        case boolFlag === true:
            toggleElementWithClassById(idElement, className)
            break;
        case boolFlag === false:
            closeWordsFreqTopNav(idElement)
            break;
        default:
            console.error("toggleOrCloseByBoolAndId::something is wrong: idElement => ", idElement, "#")
            console.error("toggleOrCloseByBoolAndId::something is wrong: boolFlag => ", boolFlag, "#")
    }
}

async function updateWordsFreqIfPressEnter() {
    if (event.key === 'Enter') {
        closeWordsFreqTopNav('wordsFreqNavbarNavDropdown')
        const webserverIsCheckedEl = document.getElementById("id-input-webserver-wordfreq-checkbox")
        const webserverIsChecked = webserverIsCheckedEl.checked
        if (!webserverIsChecked) {
            await getWordsFrequency()
        } else {
            // in case id-input-webserver-wordfreq-checkbox is checked, this will only fire updateWordsFrequencyTables()
            // use instead btn4-get-words-frequency-get to fire getWordsFrequency()
            updateWordsFrequencyTables()
        }
    }
}

function gotoCurrentTableOfWords() {
    if (isMobilePortrait()) {
        console.log("gotoCurrentTableOfWords::isMobilePortrait()...")
        addClassById("id-current-table-of-words-btn-back", "display-block")
        removeClassById("id-current-table-of-words-btn-back", "collapse")
        addClassById("id-current-table-of-words-container", "display-block")
        removeClassById("id-current-table-of-words-container", "collapse")
        addClassById("id-list-of-words", "collapse")
        removeClassById("id-list-of-words", "display-block")
    }
}

function toggleWebserverCheckbox() {
    const checked = document.getElementById("id-input-webserver-wordfreq-checkbox").checked
    document.getElementById('id-input-webserver-wordfreq').disabled=!checked;
    document.getElementById('id-wordfreq-show-analyzer').innerText=checked?'webserver':'embedded';
}

function backToListFromCurrentTable() {
    if (isMobilePortrait()) {
        removeClassById("id-current-table-of-words-container", "display-block")
        addClassById("id-current-table-of-words-container", "collapse")
        removeClassById("id-list-of-words", "collapse")
        addClassById("id-list-of-words", "display-block")
    }
}

function isMobilePortrait() {
    console.log("isMobilePortrait::window.innerWidth:", window.innerWidth, window.screen.orientation, "#")
    const orientation = window.screen.orientation
    return window.innerWidth <= mobileInnerSize && (orientation.type === "portrait-primary" || orientation.type === "portrait-secondary")
}

function handleMobileWindow() {
    if (isMobile()) {
        closeWordsFreqTopNav("id-container-desktop-menu")
        closeWordsFreqTopNav("id-container-filter-sort-order")
        addClassById('id-words-frequency-table-title', "collapse");
        removeClassById('id-words-frequency-table-title-mobile', "collapse");
        removeClassById('id-container-mobile-menu', "collapse");
        removeClassById('id-container-filter-sort-order', "display-flex");
        removeClassById('id-container-filter-word-list', "width-50perc");
        removeClassById('id-container-sort-order-word-list', "width-50perc");

        removeClassById('id-current-table-of-words-container', "margin10px");
        addClassById('id-current-table-of-words-container', "margin2px");
    } else {
        closeWordsFreqTopNav("id-container-mobile-menu")
        // Always show desktop container on desktop
        removeClassById('id-container-desktop-menu', "collapse");
        removeClassById('id-container-filter-sort-order', "collapse");
        addClassById('id-container-filter-sort-order', "display-flex");
        addClassById('id-words-frequency-table-title-mobile', "collapse");
        addClassById('id-container-filter-word-list', "width-50perc");
        removeClassById('id-words-frequency-table-title', "collapse");
        addClassById('id-current-table-of-words-container', "margin10px");
        removeClassById('id-current-table-of-words-container', "margin2px");
    }
}

function isMobile() {
    return window.innerWidth <= mobileInnerSize || window.innerHeight <= mobileInnerSize;
}

window.addEventListener('resize', handleMobileWindow);
window.addEventListener('DOMContentLoaded', handleMobileWindow);
console.log('DOMContentLoaded');