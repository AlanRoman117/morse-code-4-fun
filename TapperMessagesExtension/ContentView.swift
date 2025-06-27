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
    @State private var morsePreviewImage: UIImage? = nil
    @State private var debouncedUpdatePreviewTimer: Timer? = nil

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
    @State private var isTapAreaPressed: Bool = false // For visual feedback on tap area

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
                    .padding(EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 10))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemFill))
                    .cornerRadius(8)
                    .lineLimit(3)


                Text("TEXT: \(decodedTextDisplay)")
                    .font(.headline)
                    .padding(EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 10))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(UIColor.secondarySystemFill))
                    .cornerRadius(8)
                    .lineLimit(3)
            }
            .padding(.horizontal)

            Spacer()

            // Tap Button
            Button(action: {
                 // Action intentionally empty, gestures handle primary interaction.
                 // This Button wrapper helps with accessibility.
            }) {
                Text("Tap!")
                    .fontWeight(.bold)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
                    .background(isTapAreaPressed ? Color.blue.opacity(0.7) : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .scaleEffect(isTapAreaPressed ? 0.97 : 1.0)
            }
            .animation(.spring(response: 0.15, dampingFraction: 0.5), value: isTapAreaPressed)
            .simultaneousGesture(LongPressGesture(minimumDuration: shortTapThreshold)
                .onEnded { _ in
                    self.isTapAreaPressed = true
                    self.isLongPressTriggered = true
                    self.handleTapInput(isLong: true)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        self.isTapAreaPressed = false
                    }
                }
            )
            .simultaneousGesture(TapGesture()
                .onEnded {
                    if !self.isLongPressTriggered {
                        self.isTapAreaPressed = true
                        self.handleTapInput(isLong: false)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                           self.isTapAreaPressed = false
                        }
                    }
                    // Reset long press flag AFTER checking it
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

            // Preview Section
            if !fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                VStack(alignment: .leading) {
                    Text("PREVIEW")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(UIColor.secondaryLabel))
                        .padding(.leading, 15)

                    HStack(spacing: 0) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(decodedTextDisplay.isEmpty ? "Morse Code Message" : decodedTextDisplay)
                                .font(.system(size: 15, weight: .regular))
                                .lineLimit(2)
                            Text(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines))
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(Color(UIColor.secondaryLabel))
                                .lineLimit(1)
                        }
                        .padding(.vertical, 8)
                        .padding(.leading, 12)
                        .padding(.trailing, 8)

                        Spacer(minLength: 8)

                        if let previewImage = morsePreviewImage {
                            Image(uiImage: previewImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(maxHeight: 30)
                                .padding(.trailing, 12)
                        }
                    }
                    .frame(minHeight: 46)
                    .background(Color(UIColor.tertiarySystemBackground))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color(UIColor.systemGray3), lineWidth: 0.5)
                    )
                }
                .padding(.horizontal)
                .padding(.bottom, 10)
            }

            Button("Send Message") {
                sendMessageAction()
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.purple)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal)
            .disabled(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) // Disable if no Morse
        }
        .padding(.bottom)
        .onChange(of: fullMorseStringDisplay) { newValue in
            debouncedUpdatePreviewTimer?.invalidate()
            debouncedUpdatePreviewTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false) { _ in
                updatePreviewImage(morse: newValue)
            }
        }
    }

    private func updatePreviewImage(morse: String) {
        let trimmedMorse = morse.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedMorse.isEmpty {
            morsePreviewImage = nil
            return
        }
        if let mvc = messagesViewController {
            self.morsePreviewImage = mvc.generateMorseImage(morseCode: trimmedMorse, desiredHeight: 30.0)
        } else {
            print("MessagesViewController not available for preview generation.")
            self.morsePreviewImage = nil
        }
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
