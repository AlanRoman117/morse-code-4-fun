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

    init() {
        // Initialization, if any, can go here.
        // For now, the dictionary is statically defined.
    }

    /// Converts a single Morse code string to its English character equivalent.
    /// - Parameter morse: The Morse code string (e.g., ".-").
    /// - Returns: The corresponding English character (e.g., "A") or nil if not found.
    func morseToEnglish(morse: String) -> String? {
        return morseCodeDictionary[morse]
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
