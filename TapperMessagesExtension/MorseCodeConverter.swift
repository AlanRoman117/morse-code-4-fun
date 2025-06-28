//
//  MorseCodeConverter.swift
//  TapperMessagesExtension
//
//  Created by Jules on [Current Date].
//

import Foundation

class MorseCodeConverter {
    private let morseCodeDictionary: [String: String] = [
        ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
        "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
        "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
        ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
        "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
        "--..": "Z", "-----": "0", ".----": "1", "..---": "2",
        "...--": "3", "....-": "4", ".....": "5", "-....": "6",
        "--...": "7", "---..": "8", "----.": "9", ".-.-.-": ".",
        "--..--": ",", "..--..": "?", ".----.": "'", "-.-.--": "!",
        "-..-.": "/", "-.--.": "(", "-.--.-": ")", ".-...": "&",
        "---...": ":", "-.-.-.": ";", "-...-": "=", ".-.-.": "+",
        "-....-": "-", "..--.-": "_", ".-..-.": "\"", "...-..-": "$",
        ".--.-.": "@", "...---...": "SOS"
    ]

    private let englishToMorseDictionary: [String: String]

    init() {
        // Initialization, if any, can go here.
        // For now, the dictionary is statically defined.
        var tempEnglishToMorse: [String: String] = [:]
        for (key, value) in morseCodeDictionary {
            tempEnglishToMorse[value] = key
        }
        // Add space, as it's a common character to look up for backspace logic (though not in morseCodeDictionary)
        tempEnglishToMorse[" "] = " / " // Representing space as its Morse word separator
        self.englishToMorseDictionary = tempEnglishToMorse
    }

    /// Converts a single Morse code string to its English character equivalent.
    /// - Parameter morse: The Morse code string (e.g., ".-").
    /// - Returns: The corresponding English character (e.g., "A") or nil if not found.
    func morseToEnglish(morse: String) -> String? {
        return morseCodeDictionary[morse]
    }

    /// Generates a list of character predictions based on a Morse code prefix.
    /// - Parameter morsePrefix: The current Morse input from the user (e.g., ".-").
    /// - Returns: An array of tuples, each containing the character, its full Morse code,
    ///            and a flag indicating if it's an exact match.
    ///            Example: [("A", ".-", true), ("R", ".-.", false)]
    func getPredictions(for morsePrefix: String) -> [(char: String, morse: String, isExactMatch: Bool)] {
        guard !morsePrefix.isEmpty else {
            return []
        }

        var predictions: [(char: String, morse: String, isExactMatch: Bool)] = []

        // To prioritize exact match if found
        var exactMatchFound: (char: String, morse: String, isExactMatch: Bool)? = nil

        for (morseValue, charValue) in morseCodeDictionary { // Iterate morse:char
            if morseValue == morsePrefix {
                exactMatchFound = (char: charValue, morse: morseValue, isExactMatch: true)
            } else if morseValue.starts(with: morsePrefix) {
                predictions.append((char: charValue, morse: morseValue, isExactMatch: false))
            }
        }

        // Sort partial matches alphabetically by character for consistent ordering
        predictions.sort { $0.char < $1.char }

        // Prepend exact match if it exists
        if let exact = exactMatchFound {
            predictions.insert(exact, at: 0)
        }

        return predictions
    }

    /// Converts an English character to its Morse code string equivalent.
    /// - Parameter char: The English character (e.g., "A").
    /// - Returns: The corresponding Morse code string (e.g., ".-") or nil if not found.
    func englishToMorse(char: String) -> String? {
        // Ensure the input is a single character and uppercase it for dictionary lookup
        guard char.count == 1 else {
            // Handle multi-character strings if necessary, or return nil for simplicity
            // For "SOS", it's a special case in morseCodeDictionary, not single chars.
            // This function is primarily for single character backspace.
            if char.uppercased() == "SOS" { // Special case for "SOS" if it was typed as a block
                return englishToMorseDictionary["SOS"]
            }
            return nil
        }
        return englishToMorseDictionary[char.uppercased()]
    }

    /// Converts a full Morse code sequence to an English string.
    /// Morse letters are expected to be separated by a single space.
    /// Morse words are expected to be separated by " / " (space, slash, space) or just "/" if that's how it's input.
    /// - Parameter morseSequence: The full Morse code string (e.g., ".... . .-.. .-.. --- / .-- --- .-. .-.. -..").
    /// - Returns: The decoded English string.
    func fullMorseToEnglish(morseSequence: String) -> String {
        // Normalize word separators: replace " / " with a single unique separator if needed,
        // or handle multiple space characters robustly.
        // For simplicity, let's assume words are separated by " / " or just "/".
        // And letters within a word are separated by a single space.

        let trimmedSequence = morseSequence.trimmingCharacters(in: .whitespacesAndNewlines)

        // Split by word separator. Using "/ " as a common pattern, but could be just "/"
        // To be more robust, we can replace " / " with just "/" first, then split by "/"
        let words = trimmedSequence.replacingOccurrences(of: " / ", with: "/").components(separatedBy: "/")

        var englishText = ""

        for (wordIndex, word) in words.enumerated() {
            let letters = word.trimmingCharacters(in: .whitespacesAndNewlines).components(separatedBy: " ")
            var currentWordText = ""
            for letterMorse in letters {
                if !letterMorse.isEmpty { // Ensure we don't process empty strings from multiple spaces
                    if let englishChar = morseCodeDictionary[letterMorse] {
                        currentWordText += englishChar
                    } else {
                        currentWordText += "?" // Indicate unrecognized Morse code for a letter
                    }
                }
            }
            englishText += currentWordText
            if wordIndex < words.count - 1 { // Add space between words, but not after the last word
                englishText += " "
            }
        }
        return englishText
    }

    // Functions to be used by ContentView for building up the Morse string
    // These are not strictly part of "conversion" but are helpers for the UI logic.

    /// Appends a dot or dash to the current Morse character being formed.
    /// - Parameter symbol: "." or "-"
    /// - Parameter currentMorseChar: The current Morse character string being built.
    /// - Returns: The updated Morse character string.
    func appendSymbolToCurrentChar(symbol: String, currentMorseChar: inout String) {
        currentMorseChar += symbol
    }

    /// Finalizes the current Morse character, optionally adding it to the full Morse string and returning its English equivalent.
    /// - Parameter currentMorseChar: The Morse character to finalize.
    /// - Parameter fullMorseString: The complete Morse sequence built so far.
    /// - Returns: The English equivalent of currentMorseChar, or nil.
    func finalizeCharacter(currentMorseChar: String, fullMorseString: inout String) -> String? {
        guard !currentMorseChar.isEmpty else { return nil }

        fullMorseString += currentMorseChar
        fullMorseString += " " // Add a space to separate letters in the full Morse string

        return morseToEnglish(morse: currentMorseChar)
    }

    /// Adds a word space to the full Morse string.
    /// - Parameter fullMorseString: The complete Morse sequence built so far.
    func addWordSpace(fullMorseString: inout String) {
        // Remove trailing space if it's from the last letter, then add word separator
        if fullMorseString.hasSuffix(" ") {
            fullMorseString = String(fullMorseString.dropLast())
        }
        fullMorseString += " / " // Using " / " as the word separator
    }
}
