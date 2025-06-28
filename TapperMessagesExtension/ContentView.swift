//
//  ContentView.swift
//  TapperMessagesExtension
//
//  Created by Jules on [Current Date].
//

import SwiftUI
import AVFoundation // Added for audio feedback

// MARK: - AudioManager (Basic Implementation)
private class AudioManager {
    private var engine: AVAudioEngine
    private var playerNode: AVAudioPlayerNode
    private var audioFormat: AVAudioFormat?

    init() {
        engine = AVAudioEngine()
        playerNode = AVAudioPlayerNode()

        engine.attach(playerNode)

        // Get the native audio format of the engine's output node.
        // This ensures compatibility with the hardware.
        let outputNode = engine.outputNode
        let outputFormat = outputNode.outputFormat(forBus: 0)
        audioFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, // Use Float32 for sine wave generation
                                     sampleRate: outputFormat.sampleRate, // Use hardware sample rate
                                     channels: 1, // Mono
                                     interleaved: false)

        engine.connect(playerNode, to: outputNode, format: audioFormat)

        do {
            try engine.start()
        } catch {
            print("AudioManager: Could not start audio engine: \(error.localizedDescription)")
        }
    }

    private func generateSineWaveBuffer(frequency: Float, duration: Float, volume: Float) -> AVAudioPCMBuffer? {
        guard let format = audioFormat else {
            print("AudioManager: Audio format not available.")
            return nil
        }

        let sampleRate = Float(format.sampleRate)
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            print("AudioManager: Could not create PCM buffer.")
            return nil
        }
        buffer.frameLength = frameCount

        guard let channelData = buffer.floatChannelData?[0] else {
            print("AudioManager: Could not get channel data.")
            return nil
        }

        let twoPi = 2 * Float.pi
        let angularFrequency = twoPi * frequency / sampleRate

        for frame in 0..<Int(frameCount) {
            let value = sin(Float(frame) * angularFrequency) * volume
            channelData[frame] = value
        }

        return buffer
    }

    func playSound(frequency: Float, duration: Float, volume: Float = 0.3) {
        if !engine.isRunning {
            do {
                try engine.start() // Try to start it again if it stopped
            } catch {
                print("AudioManager: Engine not running and could not be restarted: \(error.localizedDescription)")
                return
            }
        }

        guard let buffer = generateSineWaveBuffer(frequency: frequency, duration: duration, volume: volume) else {
            print("AudioManager: Buffer generation failed.")
            return
        }

        playerNode.scheduleBuffer(buffer) {
            // print("AudioManager: Buffer playback completed.")
            // This completion handler is called when the buffer finishes playing.
            // Could be used for cleanup or state changes if needed.
        }

        if !playerNode.isPlaying {
            playerNode.play()
        }
    }

    // Convenience methods for different sounds
    func playDotSound() {
        playSound(frequency: 880, duration: 0.08) // Short, higher pitch
    }

    func playDashSound() {
        playSound(frequency: 770, duration: 0.15) // Slightly longer, medium pitch
    }

    func playButtonFeedbackSound() {
        playSound(frequency: 1200, duration: 0.05, volume: 0.2) // Short, soft click-like sound
    }

    func playSendSound() {
        playSound(frequency: 1000, duration: 0.05)
        // Could play a sequence for more distinct feedback
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.07) {
            self.playSound(frequency: 1300, duration: 0.08)
        }
    }

    func playClearSound() {
         playSound(frequency: 600, duration: 0.1, volume: 0.25)
    }
}


// MARK: - Color Palette (Simplified)
// In a real app, these would be in Assets.xcassets for full light/dark mode support.
private struct Theme {
    static func color(light: Color, dark: Color, scheme: ColorScheme) -> Color {
        return scheme == .dark ? dark : light
    }

    // Define base colors for light and dark mode
    static let lightAppBackground = Color(red: 0.96, green: 0.96, blue: 0.98)
    static let darkAppBackground = Color(red: 0.12, green: 0.12, blue: 0.18)

    static let lightSurfaceBackground = Color.white
    static let darkSurfaceBackground = Color(red: 0.18, green: 0.18, blue: 0.24)

    static let lightPrimaryAction = Color(red: 0.0, green: 0.45, blue: 0.85)
    static let darkPrimaryAction = Color(red: 0.2, green: 0.6, blue: 0.95)

    static let lightTapArea = Color(red: 0.1, green: 0.5, blue: 0.9)
    static let darkTapArea = Color(red: 0.25, green: 0.55, blue: 0.9)


    static let lightSecondaryAction = Color(red: 0.5, green: 0.5, blue: 0.55)
    static let darkSecondaryAction = Color(red: 0.45, green: 0.45, blue: 0.5)

    static let lightPositiveAction = Color(red: 0.2, green: 0.7, blue: 0.3)
    static let darkPositiveAction = Color(red: 0.3, green: 0.8, blue: 0.4)

    static let lightWarningAction = Color(red: 0.9, green: 0.6, blue: 0.0)
    static let darkWarningAction = Color(red: 1.0, green: 0.7, blue: 0.1)

    static let lightDestructiveAction = Color(red: 0.85, green: 0.25, blue: 0.25)
    static let darkDestructiveAction = Color(red: 0.9, green: 0.3, blue: 0.3)

    static let lightTextPrimary = Color.black
    static let darkTextPrimary = Color.white

    static let lightTextSecondary = Color(white: 0.4)
    static let darkTextSecondary = Color(white: 0.75)

    static let lightMorseText = Color(red: 0.05, green: 0.05, blue: 0.4) // Darker blue for Morse on light
    static let darkMorseText = Color(red: 0.9, green: 0.85, blue: 0.5) // Yellowish for Morse

    // Dynamic Colors
    static func appBackground(for scheme: ColorScheme) -> Color { color(light: lightAppBackground, dark: darkAppBackground, scheme: scheme) }
    static func surfaceBackground(for scheme: ColorScheme) -> Color { color(light: lightSurfaceBackground, dark: darkSurfaceBackground, scheme: scheme) }
    static func primaryAction(for scheme: ColorScheme) -> Color { color(light: lightPrimaryAction, dark: darkPrimaryAction, scheme: scheme) }
    static func tapArea(for scheme: ColorScheme) -> Color { color(light: lightTapArea, dark: darkTapArea, scheme: scheme) }
    static func tapAreaActive(for scheme: ColorScheme) -> Color { color(light: lightPrimaryAction.opacity(0.7), dark: darkPrimaryAction.opacity(0.7), scheme: scheme) }
    static func secondaryAction(for scheme: ColorScheme) -> Color { color(light: lightSecondaryAction, dark: darkSecondaryAction, scheme: scheme) }
    static func positiveAction(for scheme: ColorScheme) -> Color { color(light: lightPositiveAction, dark: darkPositiveAction, scheme: scheme) }
    static func warningAction(for scheme: ColorScheme) -> Color { color(light: lightWarningAction, dark: darkWarningAction, scheme: scheme) }
    static func destructiveAction(for scheme: ColorScheme) -> Color { color(light: lightDestructiveAction, dark: darkDestructiveAction, scheme: scheme) }
    static func textPrimary(for scheme: ColorScheme) -> Color { color(light: lightTextPrimary, dark: darkTextPrimary, scheme: scheme) }
    static func textSecondary(for scheme: ColorScheme) -> Color { color(light: lightTextSecondary, dark: darkTextSecondary, scheme: scheme) }
    static func morseText(for scheme: ColorScheme) -> Color { color(light: lightMorseText, dark: darkMorseText, scheme: scheme) }

    static let buttonCornerRadius: CGFloat = 10
    static let displayCornerRadius: CGFloat = 8
}

// MARK: - Haptic Manager (Simplified) - REMOVED
// private class HapticFeedbackManager { ... } // Entire class removed


struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme
    @StateObject private var audioManager = AudioManager() // Instantiate AudioManager

    // @GestureState private var isLongPressingForDash = false // REMOVED - Was for haptics

    // State variables for the UI
    @State private var currentMorseCharDisplay: String = ""
    @State private var fullMorseStringDisplay: String = ""
    @State private var decodedTextDisplay: String = ""
    @State private var morsePreviewImage: UIImage? = nil
    @State private var debouncedUpdatePreviewTimer: Timer? = nil

    // Internal state for logic
    @State private var activeMorseChar: String = ""

    // Morse code converter instance
    private let morseConverter = MorseCodeConverter()

    // Reference to the MessagesViewController to send messages
    var messagesViewController: MessagesViewController?

    // Constants for tap detection
    private let shortTapThreshold: TimeInterval = 0.25
    private let letterTimeoutDuration: TimeInterval = 1.0

    // Timer and tap state
    @State private var letterTimeoutTimer: Timer? = nil
    @State private var lastTapTimestamp: Date = Date()
    @State private var isLongPressTriggered: Bool = false
    @State private var isTapAreaPressed: Bool = false

    // Predictive Text State
    @State private var predictiveChars: [(char: String, morse: String, isExactMatch: Bool)] = []
    @State private var showPredictiveDisplay: Bool = false
    @State private var predictiveDisplayTimer: Timer? = nil
    private let predictiveDisplayDuration: TimeInterval = 6.0
    @State private var predictionUpdateDebounceTimer: Timer? = nil // For debouncing prediction updates
    private let predictionDebounceInterval: TimeInterval = 0.1 // 100ms debounce

    private var currentAppBackground: Color { Theme.appBackground(for: colorScheme) }
    private var currentSurfaceBackground: Color { Theme.surfaceBackground(for: colorScheme) }
    private var currentPrimaryAction: Color { Theme.primaryAction(for: colorScheme) }
    private var currentTapArea: Color { Theme.tapArea(for: colorScheme) }
    private var currentTapAreaActive: Color { Theme.tapAreaActive(for: colorScheme) }
    private var currentSecondaryAction: Color { Theme.secondaryAction(for: colorScheme) }
    private var currentPositiveAction: Color { Theme.positiveAction(for: colorScheme) }
    private var currentWarningAction: Color { Theme.warningAction(for: colorScheme) }
    private var currentDestructiveAction: Color { Theme.destructiveAction(for: colorScheme) }
    private var currentTextPrimary: Color { Theme.textPrimary(for: colorScheme) }
    private var currentTextSecondary: Color { Theme.textSecondary(for: colorScheme) }
    private var currentMorseText: Color { Theme.morseText(for: colorScheme) }


    var body: some View {
        VStack(spacing: 16) { // Consistent spacing
            Text("Morse Code Tapper")
                .font(.title2).bold()
                .foregroundColor(currentTextPrimary)
                .padding(.top)

            // Display Areas
            VStack(alignment: .leading, spacing: 10) {
                Text("LIVE: \(currentMorseCharDisplay.isEmpty ? "-" : currentMorseCharDisplay)")
                    .font(.custom("Menlo-Bold", size: 18))
                    .foregroundColor(currentPrimaryAction)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineLimit(1)
                    .padding(.horizontal, 5)


                DisplayBox(title: "MORSE", content: $fullMorseStringDisplay, font: .custom("Menlo", size: 16), textColor: currentMorseText, backgroundColor: currentSurfaceBackground)
                DisplayBox(title: "TEXT", content: $decodedTextDisplay, font: .headline, textColor: currentTextPrimary, backgroundColor: currentSurfaceBackground)
            }
            .padding(.horizontal)

            Spacer()

            // Predictive Display Area
            if showPredictiveDisplay {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        if predictiveChars.isEmpty && !activeMorseChar.isEmpty {
                             PredictiveBadgeView(prediction: (char: "No match", morse: "", isExactMatch: false), charColor: currentTextSecondary, bgColor: currentSurfaceBackground.opacity(0.7))
                        } else {
                            ForEach(predictiveChars, id: \.char) { prediction in
                                PredictiveBadgeView(prediction: prediction, charColor: currentTextPrimary, bgColor: currentSurfaceBackground)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .frame(height: 40) // Adjust height as needed
                .transition(.opacity.combined(with: .move(edge: .bottom)))
                .onTapGesture { // Allow user to tap display to reset timer (optional)
                    startPredictiveDisplayTimer()
                }
            } else {
                // Placeholder to maintain layout stability when predictive display is hidden
                Spacer().frame(height: 40)
            }


            // Tap Button - Circular
            Button(action: {
                 // Action intentionally empty, gestures handle primary interaction.
            }) {
                Text("TAP")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .padding()
                    .frame(width: 110, height: 110)
                    .background(isTapAreaPressed ? currentTapAreaActive : currentTapArea)
                    .foregroundColor(.white)
                    .clipShape(Circle())
                    .scaleEffect(isTapAreaPressed ? 0.95 : 1.0)
                    .shadow(color: currentTapArea.opacity(0.4), radius: isTapAreaPressed ? 5 : 10, x: 0, y: isTapAreaPressed ? 3 : 6)
            }
            .animation(.spring(response: 0.15, dampingFraction: 0.5), value: isTapAreaPressed)
            .gesture(
                LongPressGesture(minimumDuration: shortTapThreshold)
                    .onEnded { _ in
                        self.isTapAreaPressed = true
                        self.isLongPressTriggered = true
                        audioManager.playDashSound() // Play dash sound
                        self.handleTapInput(isLong: true)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                            self.isTapAreaPressed = false
                        }
                    }
            )
            .simultaneousGesture(
                TapGesture()
                    .onEnded {
                        if !self.isLongPressTriggered {
                            self.isTapAreaPressed = true
                            audioManager.playDotSound() // Play dot sound
                            self.handleTapInput(isLong: false)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                               self.isTapAreaPressed = false
                            }
                        }
                        self.isLongPressTriggered = false
                    }
            )
            .padding(.horizontal)
            .padding(.vertical, 5)


            // Control Buttons
            HStack(spacing: 12) {
                actionButton(title: "Next Letter", color: currentPositiveAction, action: processCurrentCharAction, audioFeedback: audioManager.playButtonFeedbackSound)
                actionButton(title: "Word Space", color: currentWarningAction, action: addWordSpaceAction, audioFeedback: audioManager.playButtonFeedbackSound)
            }
            .padding(.horizontal)

            HStack(spacing: 12) {
                actionButton(title: "Clear All", color: currentDestructiveAction, icon: "trash", action: clearAllAction, audioFeedback: audioManager.playClearSound)
                actionButton(title: "Backspace", color: currentSecondaryAction, icon: "delete.left", action: deleteLastCharAction, audioFeedback: audioManager.playButtonFeedbackSound)
            }
            .padding(.horizontal)


            Spacer()

            // Preview Section
            if !fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MESSAGE PREVIEW")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(currentTextSecondary)
                        .padding(.leading, 15)

                    HStack(spacing: 0) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(decodedTextDisplay.isEmpty ? "Morse Code Message" : decodedTextDisplay)
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(currentTextPrimary) // Use themed text color
                                .lineLimit(2)
                            Text(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines))
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(currentTextSecondary) // Use themed text color
                                .lineLimit(1)
                        }
                        .padding(.vertical, 10)
                        .padding(.leading, 12)
                        .padding(.trailing, 8)

                        Spacer(minLength: 8)

                        if let previewImage = morsePreviewImage {
                            Image(uiImage: previewImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(maxHeight: 30) // Ensure this is appropriate for the image generator
                                .padding(.trailing, 12)
                        }
                    }
                    .frame(minHeight: 50) // Ensure min height
                    .background(Theme.surfaceBackground(for: colorScheme == .dark ? .light : .dark).opacity(0.1)) // Slightly contrasting background for preview
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.color(light: Color.gray.opacity(0.3), dark: Color.gray.opacity(0.4), scheme: colorScheme), lineWidth: 1)
                    )
                }
                .padding(.horizontal)
                .padding(.bottom, 10)
            }


            Button {
                audioManager.playSendSound() // Play send sound
                sendMessageAction()
            } label: {
                Label("Send Message", systemImage: "paperplane.fill")
                    .fontWeight(.semibold)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(currentPrimaryAction)
                    .foregroundColor(.white)
                    .cornerRadius(Theme.buttonCornerRadius)
            }
            .disabled(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .padding(.horizontal)
        }
        .padding(.bottom)
        .background(currentAppBackground.edgesIgnoringSafeArea(.all)) // Apply background to whole view
        .onAppear {
            // The AudioManager's init now starts the engine.
            // We could add a specific "prime" or "warmup" call here if first sound has latency.
            // For now, relying on init.
            // Example: audioManager.primeEngine()
        }
        .onChange(of: fullMorseStringDisplay) { oldValue, newValue in // Updated to modern onChange
            debouncedUpdatePreviewTimer?.invalidate()
            debouncedUpdatePreviewTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false) { _ in
                updatePreviewImage(morse: newValue)
            }
        }
    }

    // Reusable Action Button
    @ViewBuilder
    private func actionButton(title: String, color: Color, icon: String? = nil, action: @escaping () -> Void, audioFeedback: (() -> Void)? = nil) -> some View {
        Button {
            audioFeedback?() // Call audio feedback if provided
            action()
        } label: {
            HStack {
                if let iconName = icon {
                    Image(systemName: iconName)
                }
                Text(title)
            }
            .fontWeight(.medium)
            .padding(.vertical, 12)
            .padding(.horizontal)
            .frame(maxWidth: .infinity)
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(Theme.buttonCornerRadius)
        }
    }

    // Reusable Display Box for Morse/Text
    private struct DisplayBox: View {
        let title: String
        @Binding var content: String
        let font: Font
        let textColor: Color
        let backgroundColor: Color
        @Environment(\.colorScheme) var colorScheme

        var body: some View {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption.weight(.medium))
                    .foregroundColor(Theme.textSecondary(for: colorScheme))
                ScrollView(.vertical, showsIndicators: true) {
                    Text(content.isEmpty ? "-" : content)
                        .font(font)
                        .foregroundColor(textColor)
                        .padding(10)
                        .frame(maxWidth: .infinity, minHeight: 50, alignment: .topLeading) // Min height for small content
                        .lineLimit(nil) // Allow unlimited lines
                }
                .background(backgroundColor)
                .cornerRadius(Theme.displayCornerRadius)
                .frame(maxHeight: 100) // Max height before scrolling
            }
        }
    }


    private func updatePreviewImage(morse: String) {
        let trimmedMorse = morse.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedMorse.isEmpty {
            morsePreviewImage = nil
            return
        }
        // Ensure messagesViewController is available (it should be)
        // The image generation in MessagesViewController uses UIColor.label, which is good for light/dark mode.
        if let mvc = messagesViewController {
            self.morsePreviewImage = mvc.generateMorseImage(morseCode: trimmedMorse, desiredHeight: 30.0)
        } else {
            // This case might happen in SwiftUI previews if mvc is nil.
            // For actual use, mvc should be provided by MessagesViewController.
            print("MessagesViewController not available for preview generation.")
            // Create a placeholder image for previews if needed
            #if DEBUG
            // self.morsePreviewImage = UIImage(systemName: "photo.on.rectangle.angled") // Example placeholder
            #else
            self.morsePreviewImage = nil
            #endif
        }
    }

    // MARK: - Tap Input Handling

    private func handleTapInput(isLong: Bool) {
        invalidateLetterTimeoutTimer()
        predictiveDisplayTimer?.invalidate() // Invalidate hide timer on new input

        activeMorseChar += isLong ? "-" : "."
        currentMorseCharDisplay = activeMorseChar // Immediate feedback for the tapped dot/dash

        // Debounce the prediction update
        predictionUpdateDebounceTimer?.invalidate()
        predictionUpdateDebounceTimer = Timer.scheduledTimer(withTimeInterval: predictionDebounceInterval, repeats: false) { _ in
            updatePredictions()
        }

        lastTapTimestamp = Date()
        startLetterTimeoutTimer()
    }

    // MARK: - Predictive Text Logic
    private func updatePredictions() {
        // This function is now called after a debounce when activeMorseChar might have changed multiple times.
        // We use the current activeMorseChar for predictions.
        if activeMorseChar.isEmpty {
            // If, after debouncing, activeMorseChar is empty (e.g., cleared by another action quickly),
            // then hide predictions.
            if showPredictiveDisplay { // Only animate if it was showing
                 withAnimation(.easeInOut(duration: 0.2)) { // Shorter animation for hide
                    showPredictiveDisplay = false
                }
            }
            predictiveChars = []
            predictiveDisplayTimer?.invalidate() // Stop any active hide timer
        } else {
            predictiveChars = morseConverter.getPredictions(for: activeMorseChar)
            // Show predictions if there are any, or if user typed something (to show "No match")
            if !predictiveChars.isEmpty || !activeMorseChar.isEmpty {
                if !showPredictiveDisplay { // Animate in if it was hidden
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showPredictiveDisplay = true
                    }
                } else { // If already showing, just ensure it's true (no animation needed for content change)
                    showPredictiveDisplay = true
                }
                startPredictiveDisplayTimer() // Start/reset the auto-hide timer
            } else { // No predictions and activeMorseChar is somehow empty (should be caught by first if)
                if showPredictiveDisplay {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showPredictiveDisplay = false
                    }
                }
                predictiveDisplayTimer?.invalidate()
            }
        }
    }

    private func startPredictiveDisplayTimer() {
        predictiveDisplayTimer?.invalidate()
        predictiveDisplayTimer = Timer.scheduledTimer(withTimeInterval: predictiveDisplayDuration, repeats: false) { _ in
            withAnimation(.easeInOut(duration: 0.3)) {
                showPredictiveDisplay = false
            }
        }
    }

    // MARK: - Letter Timeout Logic

    private func startLetterTimeoutTimer() {
        invalidateLetterTimeoutTimer()
        letterTimeoutTimer = Timer.scheduledTimer(withTimeInterval: letterTimeoutDuration, repeats: false) { _ in
            if !self.activeMorseChar.isEmpty && Date().timeIntervalSince(self.lastTapTimestamp) >= self.letterTimeoutDuration {
                self.processCurrentCharAction(isAutoFinalized: true) // Pass flag if needed
            }
        }
    }

    private func invalidateLetterTimeoutTimer() {
        letterTimeoutTimer?.invalidate()
        letterTimeoutTimer = nil
    }

    // MARK: - UI Actions

    private func processCurrentCharAction(isAutoFinalized: Bool = false) {
        invalidateLetterTimeoutTimer()

        guard !activeMorseChar.isEmpty else {
            activeMorseChar = ""
            clearAndHidePredictions()
            return
        }

        fullMorseStringDisplay += activeMorseChar

        if let englishChar = morseConverter.morseToEnglish(morse: activeMorseChar) {
            decodedTextDisplay += englishChar
        } else {
            decodedTextDisplay += "?"
        }

        fullMorseStringDisplay += " "

        activeMorseChar = ""
        currentMorseCharDisplay = ""
        clearAndHidePredictions() // Clear predictions after processing character

        if isAutoFinalized {
            // Optionally, play a subtle haptic or UI feedback for auto-finalization
        }
    }

    private func addWordSpaceAction() {
        invalidateLetterTimeoutTimer()

        if !activeMorseChar.isEmpty {
            processCurrentCharAction() // This will call clearAndHidePredictions()
        } else {
            clearAndHidePredictions()
        }

        guard !fullMorseStringDisplay.isEmpty else { return }

        let trimmedMorse = fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedMorse.isEmpty && !trimmedMorse.hasSuffix("/") {
            if fullMorseStringDisplay.hasSuffix(" ") {
                 fullMorseStringDisplay = String(fullMorseStringDisplay.dropLast())
            }
            fullMorseStringDisplay += " / "
            decodedTextDisplay += " "
        }
    }

    private func sendMessageAction() {
        invalidateLetterTimeoutTimer()
        if !activeMorseChar.isEmpty {
            processCurrentCharAction() // This will call clearAndHidePredictions()
        } else {
            clearAndHidePredictions()
        }

        let morseToSend = fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines)
        let textToSend = decodedTextDisplay.trimmingCharacters(in: .whitespacesAndNewlines)

        if !morseToSend.isEmpty {
            messagesViewController?.sendMessage(morse: morseToSend, text: textToSend)
        }
    }

    private func clearAndHidePredictions() {
        predictionUpdateDebounceTimer?.invalidate() // Stop any pending debounce
        activeMorseChar = "" // Usually already done by caller, but good to be sure for this func's purpose
        currentMorseCharDisplay = "" // Also ensure live display is cleared
        predictiveChars = []
        if showPredictiveDisplay {
            withAnimation(.easeInOut(duration: 0.2)) {
                showPredictiveDisplay = false
            }
        }
        predictiveDisplayTimer?.invalidate()
    }

    private func clearAllAction() {
        invalidateLetterTimeoutTimer()
        clearAndHidePredictions() // Handles activeMorseChar, predictions, and timers
        fullMorseStringDisplay = ""
        decodedTextDisplay = ""
        // Haptic already played by button's action
    }

    private func deleteLastCharAction() {
        clearAndHidePredictions() // Handles activeMorseChar, predictions, and timers

        guard !decodedTextDisplay.isEmpty else { return }

        let lastCharRemoved = String(decodedTextDisplay.removeLast())

        // Rebuild fullMorseStringDisplay based on the new (shortened) decodedTextDisplay.
        // This is more robust than trying to snip the end of the old morse string,
        // especially with potential '?' characters or past inconsistencies.

        var newFullMorseString = ""
        var lastCharWasRealChar = false // To handle spacing before " / "

        for char_in_text in decodedTextDisplay {
            let charStr = String(char_in_text)
            if let morseEquivalent = morseConverter.englishToMorse(char: charStr) {
                if charStr == " " { // Current char is a space, so add word separator
                    // If the previous char was a real char (not a space), its morse would have a trailing space.
                    // We need to remove that before adding " / ".
                    if newFullMorseString.hasSuffix(" ") && lastCharWasRealChar {
                        newFullMorseString.removeLast()
                    }
                    newFullMorseString += morseEquivalent // This is " / " from converter
                    lastCharWasRealChar = false
                } else { // Current char is a letter/number/symbol
                    newFullMorseString += morseEquivalent
                    newFullMorseString += " " // Add space after the morse code for this char
                    lastCharWasRealChar = true
                }
            } else if charStr == "?" {
                 // If '?' is encountered in decodedText, it means an unknown Morse was previously entered.
                 // We can't reconstruct its original Morse. Add a placeholder.
                 // Ensure space if previous char was a real char.
                if newFullMorseString.hasSuffix(" ") && lastCharWasRealChar {
                    // OK, space already there
                } else if lastCharWasRealChar {
                     newFullMorseString += " "
                }
                newFullMorseString += "? " // Placeholder for '?' Morse and its trailing space
                lastCharWasRealChar = true // Treat '?' like a character for spacing purposes
            }
            // Else: character not in Morse map and not '?', skip or handle as error.
            // For this simple backspace, if a char is in decodedTextDisplay, it should have come from Morse.
        }

        fullMorseStringDisplay = newFullMorseString
    }
}


// MARK: - Predictive Badge View
struct PredictiveBadgeView: View {
    let prediction: (char: String, morse: String, isExactMatch: Bool)
    let charColor: Color
    let bgColor: Color
    @Environment(\.colorScheme) var colorScheme

    private var badgeBackgroundColor: Color {
        if prediction.char == "No match" {
            return Theme.surfaceBackground(for: colorScheme).opacity(0.5)
        }
        return prediction.isExactMatch ? Theme.warningAction(for: colorScheme).opacity(0.8) : Theme.surfaceBackground(for: colorScheme).opacity(0.7)
    }

    private var badgeTextColor: Color {
         if prediction.char == "No match" {
            return Theme.textSecondary(for: colorScheme)
        }
        return prediction.isExactMatch ? (colorScheme == .dark ? Color.black : Color.white) : Theme.textPrimary(for: colorScheme)
    }

    private var morseTextColor: Color {
        if prediction.char == "No match" {
            return Color.clear // Don't show morse for "No match"
        }
        return prediction.isExactMatch ? (colorScheme == .dark ? Color.black.opacity(0.7) : Color.white.opacity(0.7)) : Theme.textSecondary(for: colorScheme)
    }


    var body: some View {
        HStack(spacing: 4) {
            Text(prediction.char)
                .font(.system(size: 14, weight: .bold, design: .monospaced))
                .foregroundColor(badgeTextColor)
            if !prediction.morse.isEmpty {
                Text("(\(prediction.morse))")
                    .font(.system(size: 10, weight: .regular, design: .monospaced))
                    .foregroundColor(morseTextColor)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(badgeBackgroundColor)
        .cornerRadius(6)
    }
}


// Preview Provider remains the same
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ContentView(messagesViewController: nil)
                .preferredColorScheme(.light)
            ContentView(messagesViewController: nil)
                .preferredColorScheme(.dark)
        }
    }
}
