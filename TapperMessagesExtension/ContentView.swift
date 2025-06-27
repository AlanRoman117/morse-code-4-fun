//
//  ContentView.swift
//  TapperMessagesExtension
//
//  Created by Jules on [Current Date].
//

import SwiftUI

struct ContentView: View {
    // State variables for the UI
    @State private var currentMorseCharDisplay: String = "" // Displays live dots/dashes for the current letter
    @State private var fullMorseStringDisplay: String = ""    // Displays the sequence of confirmed Morse letters
    @State private var decodedTextDisplay: String = ""      // Displays the decoded English text

    // Internal state for logic
    @State private var activeMorseChar: String = "" // Holds the . and - for the letter currently being tapped

    // Morse code converter instance
    private let morseConverter = MorseCodeConverter()

    // Reference to the MessagesViewController to send messages
    var messagesViewController: MessagesViewController?

    // Constants for tap detection
    private let shortTapThreshold: TimeInterval = 0.25 // Max duration for a short tap
    private let letterTimeoutDuration: TimeInterval = 1.0 // Time to wait before auto-finalizing a letter

    // Timer and tap state
    @State private var letterTimeoutTimer: Timer? = nil
    @State private var lastTapTimestamp: Date = Date()
    @State private var isLongPressTriggered: Bool = false // To prevent tap after long press

    var body: some View {
        VStack(spacing: 15) {
            Text("Morse Code Tapper")
                .font(.title2)
                .padding(.top)

            // Display Areas
            VStack(alignment: .leading, spacing: 8) {
                Text("CURRENT: \(currentMorseCharDisplay)")
                    .font(.custom("Menlo", size: 16))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineLimit(1)

                Text("MORSE: \(fullMorseStringDisplay)")
                    .font(.custom("Menlo", size: 16))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineLimit(3)
                    .padding(.vertical, 5)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(5)

                Text("TEXT: \(decodedTextDisplay)")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineLimit(3)
                    .padding(.vertical, 5)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(5)
            }
            .padding(.horizontal)

            Spacer()

            // Tap Button
            Button(action: {
                // This action is primarily for accessibility or if gestures fail.
                // The main interaction is via gestures.
                // We can simulate a short tap here if needed for non-gesture interaction.
                // For now, let it be empty as gestures will handle it.
            }) {
                Text("Tap!")
                    .fontWeight(.bold)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .simultaneousGesture(LongPressGesture(minimumDuration: shortTapThreshold)
                .onChanged { _ in
                    // This onChanged can be used if we want to give feedback during the press
                }
                .onEnded { _ in
                    self.isLongPressTriggered = true
                    self.handleTapInput(isLong: true)
                }
            )
            .simultaneousGesture(TapGesture()
                .onEnded {
                    // Only process tap if long press didn't trigger for this interaction
                    if !self.isLongPressTriggered {
                        self.handleTapInput(isLong: false)
                    }
                    // Reset flag after tap processing is done
                    self.isLongPressTriggered = false
                }
            )
            .padding(.horizontal)


            // Control Buttons
            HStack(spacing: 10) {
                Button("Next Letter") {
                    processCurrentCharAction()
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(8)

                Button("Word Space") {
                    addWordSpaceAction()
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.orange)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            .padding(.horizontal)

            Button("Clear All") {
                clearAllAction()
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.red.opacity(0.8))
            .foregroundColor(.white)
            .cornerRadius(8)
            .padding(.horizontal)

            Spacer()

            Button("Send Message") {
                sendMessageAction()
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.purple)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal)
            .disabled(decodedTextDisplay.isEmpty && fullMorseStringDisplay.isEmpty)
        }
        .padding(.bottom)
    }

    // MARK: - Tap Input Handling

    private func handleTapInput(isLong: Bool) {
        invalidateLetterTimeoutTimer() // Stop any existing timer

        activeMorseChar += isLong ? "-" : "."
        currentMorseCharDisplay = activeMorseChar

        lastTapTimestamp = Date() // Record time of this tap
        startLetterTimeoutTimer() // Start timer to auto-finalize if user pauses
    }

    // MARK: - Letter Timeout Logic

    private func startLetterTimeoutTimer() {
        // Ensure no other timer is running
        invalidateLetterTimeoutTimer()

        // Start a new timer
        letterTimeoutTimer = Timer.scheduledTimer(withTimeInterval: letterTimeoutDuration, repeats: false) { _ in
            // Timer fired, means user paused after last tap.
            // Check if there's an active character and if enough time has passed since THE last tap.
            // The second check is a safeguard, though the timer itself should mean enough time passed.
            if !self.activeMorseChar.isEmpty && Date().timeIntervalSince(self.lastTapTimestamp) >= self.letterTimeoutDuration {
                self.processCurrentCharAction()
            }
        }
    }

    private func invalidateLetterTimeoutTimer() {
        letterTimeoutTimer?.invalidate()
        letterTimeoutTimer = nil
    }

    // MARK: - UI Actions

    private func processCurrentCharAction() {
        invalidateLetterTimeoutTimer() // Stop timer as char is being processed manually

        guard !activeMorseChar.isEmpty else { return }

        fullMorseStringDisplay += activeMorseChar

        if let englishChar = morseConverter.morseToEnglish(morse: activeMorseChar) {
            decodedTextDisplay += englishChar
        } else {
            decodedTextDisplay += "?"
        }

        fullMorseStringDisplay += " "

        activeMorseChar = ""
        currentMorseCharDisplay = ""
    }

    private func addWordSpaceAction() {
        invalidateLetterTimeoutTimer() // Stop timer

        if !activeMorseChar.isEmpty {
            processCurrentCharAction()
        }

        guard !fullMorseStringDisplay.isEmpty else { return }

        if fullMorseStringDisplay.hasSuffix(" ") {
            fullMorseStringDisplay = String(fullMorseStringDisplay.dropLast())
        }
        // Check if already ends with a word separator to prevent multiple word spaces
        if !fullMorseStringDisplay.hasSuffix("/ ") && !fullMorseStringDisplay.isEmpty {
            fullMorseStringDisplay += " / "
            decodedTextDisplay += " "
        } else if fullMorseStringDisplay.isEmpty { // First action is word space
             // Or decide not to allow this / handle differently
        }

    }

    private func sendMessageAction() {
        invalidateLetterTimeoutTimer()
        if !activeMorseChar.isEmpty {
            processCurrentCharAction()
        }

        if !decodedTextDisplay.isEmpty || !fullMorseStringDisplay.isEmpty {
            let morseToSend = fullMorseStringDisplay.trimmingCharacters(in: .whitespaces)
            messagesViewController?.sendMessage(morse: morseToSend, text: decodedTextDisplay)
        }
    }

    private func clearAllAction() {
        invalidateLetterTimeoutTimer()
        activeMorseChar = ""
        currentMorseCharDisplay = ""
        fullMorseStringDisplay = ""
        decodedTextDisplay = ""
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(messagesViewController: nil)
    }
}
