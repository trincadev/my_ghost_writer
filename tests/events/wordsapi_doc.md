# Get Word Details

    The above command returns JSON structured like this:

{  
"synonyms":[  
    "adorable",
    "endearing",
    "cover girl",
    "pin-up"
    ]
}

To retrieve a specific set of details of a word, for instance, a word's synonyms, append the detail type to the URL string.

These are the types of details you can retrieve:

    definitions

The meaning of the word, including its part of speech.

    synonyms

Words that can be interchanged for the original word in the same context.

    antonyms

Words that have the opposite context of the original word.

    examples

Example sentences using the word.

    typeOf

Words that are more generic than the original word. Also known as hypernyms.

For example, a hatchback is a type of car.

    hasTypes

Words that are more specific than the original word. Also known as hyponyms.

For example, purple has types violet, lavender, mauve, etc.

    partOf

The larger whole to which this word belongs. Also known as holonyms.

For example, a finger is part of a hand, a glove, a paw, etc.

    hasParts

Words that are part of the original word. Also known as meronyms.

For example, a building has parts such as roofing, plumbing etc.

    instanceOf

Words that the original word is an example of.

For example, Einstein is an instance of a physicist.

    hasInstances

Words that are examples of the original word.

For example, president has instances such as theodore roosevelt, van buren, etc.

    similarTo

Words that similar to the original word, but are not synonyms.

For example, red is similar to bloody.

    also

Phrases to which the original word belongs.

For example, bump is used in the phrase bump off.

    entails

Words that are implied by the original word. Usually used for verbs.

For example, rub entails touch.

    memberOf

A group to which the original word belongs.

For example, dory is a member of the family zeidae.

    hasMembers

Words that belong to the group defined by the original word.

For example, a cult has members called cultists.

    substanceOf

Substances to which the original word is a part of.

For example, water is a substance of sweat.

    hasSubstances

Substances that are part of the original word.

For example, wood has a substance called lignin.

    inCategory

The domain category to which the original word belongs.

For example, chaotic is in category physics.

    hasCategories

Categories of the original word.

For example, math has categories such as algebra, imaginary, numerical analysis, etc.

    usageOf

Words that the original word is a domain usage of.

For example, advil is a useage of the trademark, etc.

    hasUsages

Words that are examples of the domain the original word defines.

For example, colloquialism is a domain that includes examples like big deal, blue moon, etc.

    inRegion Regions where the word is used.

For example, chips is used in region Britain.

    regionOf

A region where words are used.

For example, Canada is the region of pogey.

    pertainsTo

Words to which the original word is relevant

For example, .22-caliber pertains to caliber.
HTTP Request

GET https://wordsapiv1.p.mashape.com/words/{word}/{detail type}