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


// MARK: - Color Palette (Analogue Theme)
private struct Theme {
    // Analogue Theme Colors - Assuming a single theme for now, not adapting to light/dark system mode.
    // If light/dark mode adaptation of this analogue theme is needed, that's a further step.
    static let appBackground = Color(hex: "#fdfdf5") // Off-white/cream
    static let textPrimary = Color(hex: "#3d3d3d")   // Dark sepia/charcoal
    static let textSecondary = Color(hex: "#5a4a3a") // Darker sepia for less emphasis

    static let morseText = Color(hex: "#3d3d3d") // Dark sepia for Morse code text
    static let liveMorseText = Color(hex: "#8b7355") // Aged brass for live input display

    static let accentBrass = Color(hex: "#a98d6a")
    static let accentBrassDarker = Color(hex: "#8b7355") // Aged brass

    static let surfaceBackground = Color(hex: "#f0eade") // Lighter parchment for input boxes, display boxes
    static let surfaceBorder = Color(hex: "#8b7355")     // Aged brass border for surfaces

    // Button specific variations
    static let buttonBackground = accentBrass
    static let buttonText = appBackground // Cream text on brass buttons
    static let buttonBorder = accentBrassDarker
    
    static let buttonHoverBackground = Color(hex: "#b99d7a") // Slightly lighter brass
    static let buttonActiveBackground = accentBrassDarker // Darker brass when pressed

    static let tapAreaBackground = accentBrass
    static let tapAreaActiveBackground = buttonActiveBackground
    static let tapAreaText = appBackground

    // For other specific actions if needed (positive, warning, destructive)
    // These can retain some color indication but muted to fit the theme, or use brass variations.
    // For now, let's make them variations of brass or a neutral sepia.
    static let positiveAction = Color(hex: "#7a8b6a") // Muted green/brass
    static let warningAction = Color(hex: "#c0a060")  // Old gold / darker yellow brass
    static let destructiveAction = Color(hex: "#8b5a5a") // Muted red/brown

    static let buttonCornerRadius: CGFloat = 4 // More squared-off for vintage feel
    static let displayCornerRadius: CGFloat = 3
}

// Helper extension to initialize Color from HEX (useful for SwiftUI)
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0) // Default to black if hex is invalid
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Haptic Manager (Simplified) - REMOVED
// private class HapticFeedbackManager { ... } // Entire class removed


struct ContentView: View {
    // @Environment(\.colorScheme) var colorScheme // Removed, theme is now fixed
    @StateObject private var audioManager = AudioManager()

    @State private var currentMorseCharDisplay: String = ""
    @State private var fullMorseStringDisplay: String = ""
    @State private var decodedTextDisplay: String = ""
    @State private var morsePreviewImage: UIImage? = nil
    @State private var debouncedUpdatePreviewTimer: Timer? = nil

    @State private var activeMorseChar: String = ""
    private let morseConverter = MorseCodeConverter()
    var messagesViewController: MessagesViewController?

    private let shortTapThreshold: TimeInterval = 0.25
    private let letterTimeoutDuration: TimeInterval = 1.0

    @State private var letterTimeoutTimer: Timer? = nil
    @State private var lastTapTimestamp: Date = Date()
    @State private var isLongPressTriggered: Bool = false
    @State private var isTapAreaPressed: Bool = false

    @State private var predictiveChars: [(char: String, morse: String, isExactMatch: Bool)] = []
    @State private var showPredictiveDisplay: Bool = false
    @State private var predictiveDisplayTimer: Timer? = nil
    private let predictiveDisplayDuration: TimeInterval = 6.0
    @State private var predictionUpdateDebounceTimer: Timer? = nil
    private let predictionDebounceInterval: TimeInterval = 0.1
    
    // Removed computed color properties, will use Theme statics directly.

    var body: some View {
        VStack(spacing: 16) {
            Text("Morse Code Tapper")
                .font(.custom("SpecialElite-Regular", size: 26)) // Updated Font
                .foregroundColor(Theme.textPrimary)
                .padding(.top)

            VStack(alignment: .leading, spacing: 10) {
                Text("LIVE: \(currentMorseCharDisplay.isEmpty ? "-" : currentMorseCharDisplay)")
                    .font(.custom("CourierPrime-Bold", size: 20)) // Updated Font
                    .foregroundColor(Theme.liveMorseText) // Updated Color
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .lineLimit(1)
                    .padding(.horizontal, 5)

                DisplayBox(title: "MORSE", content: $fullMorseStringDisplay,
                           font: .custom("CourierPrime-Regular", size: 16), // Updated Font
                           textColor: Theme.morseText,
                           backgroundColor: Theme.surfaceBackground)
                DisplayBox(title: "TEXT", content: $decodedTextDisplay,
                           font: .custom("Merriweather-Regular", size: 17), // Updated Font
                           textColor: Theme.textPrimary,
                           backgroundColor: Theme.surfaceBackground)
            }
            .padding(.horizontal)

            Spacer()
            
            if showPredictiveDisplay {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        if predictiveChars.isEmpty && !activeMorseChar.isEmpty {
                             PredictiveBadgeView(prediction: (char: "No match", morse: "", isExactMatch: false))
                        } else {
                            ForEach(predictiveChars, id: \.char) { prediction in
                                PredictiveBadgeView(prediction: prediction)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .frame(height: 40)
                .transition(.opacity.combined(with: .move(edge: .bottom)))
                .onTapGesture { startPredictiveDisplayTimer() }
            } else {
                Spacer().frame(height: 40)
            }

            Button(action: {}) {
                Text("TAP") 
                    .font(.custom("SpecialElite-Regular", size: 22)) // Updated Font
                    .padding()
                    .frame(width: 110, height: 110) 
                    .background(isTapAreaPressed ? Theme.tapAreaActiveBackground : Theme.tapAreaBackground) // Updated Color
                    .foregroundColor(Theme.tapAreaText) // Updated Color
                    .clipShape(Circle()) 
                    .scaleEffect(isTapAreaPressed ? 0.95 : 1.0)
                    .shadow(color: Theme.tapAreaBackground.opacity(0.5), radius: isTapAreaPressed ? 3 : 6, x: 0, y: isTapAreaPressed ? 2 : 4) // Adjusted shadow
            }
            .animation(.spring(response: 0.15, dampingFraction: 0.5), value: isTapAreaPressed)
            .gesture(
                LongPressGesture(minimumDuration: shortTapThreshold)
                    .onEnded { _ in 
                        self.isTapAreaPressed = true 
                        self.isLongPressTriggered = true
                        audioManager.playDashSound()
                        self.handleTapInput(isLong: true)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { self.isTapAreaPressed = false }
                    }
            )
            .simultaneousGesture(
                TapGesture()
                    .onEnded {
                        if !self.isLongPressTriggered { 
                            self.isTapAreaPressed = true
                            audioManager.playDotSound()
                            self.handleTapInput(isLong: false)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { self.isTapAreaPressed = false }
                        }
                        self.isLongPressTriggered = false
                    }
            )
            .padding(.horizontal)
            .padding(.vertical, 5)

            HStack(spacing: 12) {
                actionButton(title: "Next Letter", baseColor: Theme.positiveAction, action: processCurrentCharAction, audioFeedback: audioManager.playButtonFeedbackSound)
                actionButton(title: "Word Space", baseColor: Theme.warningAction, action: addWordSpaceAction, audioFeedback: audioManager.playButtonFeedbackSound)
            }
            .padding(.horizontal)
            
            HStack(spacing: 12) {
                actionButton(title: "Clear All", baseColor: Theme.destructiveAction, icon: "trash", action: clearAllAction, audioFeedback: audioManager.playClearSound)
                actionButton(title: "Backspace", baseColor: Theme.accentBrassDarker, icon: "delete.left", action: deleteLastCharAction, audioFeedback: audioManager.playButtonFeedbackSound)
            }
            .padding(.horizontal)

            Spacer()
            
            if !fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MESSAGE PREVIEW")
                        .font(.custom("SpecialElite-Regular", size: 12)) // Updated Font
                        .foregroundColor(Theme.textSecondary) // Updated Color
                        .padding(.leading, 15)

                    HStack(spacing: 0) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(decodedTextDisplay.isEmpty ? "Morse Code Message" : decodedTextDisplay)
                                .font(.custom("Merriweather-Regular", size: 15)) // Updated Font
                                .foregroundColor(Theme.textPrimary)
                                .lineLimit(2)
                            Text(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines))
                                .font(.custom("CourierPrime-Regular", size: 12)) // Updated Font
                                .foregroundColor(Theme.textSecondary)
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
                                .frame(maxHeight: 30)
                                .padding(.trailing, 12)
                        }
                    }
                    .frame(minHeight: 50)
                    .background(Theme.surfaceBackground.opacity(0.5)) // Slightly transparent surface
                    .cornerRadius(Theme.displayCornerRadius) // Updated CornerRadius
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.displayCornerRadius) // Updated CornerRadius
                            .stroke(Theme.surfaceBorder, lineWidth: 1) // Updated Border
                    )
                }
                .padding(.horizontal)
                .padding(.bottom, 10)
            }

            Button {
                audioManager.playSendSound()
                sendMessageAction()
            } label: {
                Label("Send Message", systemImage: "paperplane.fill")
                    .font(.custom("SpecialElite-Regular", size: 18)) // Updated Font
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Theme.accentBrass) // Updated Color
                    .foregroundColor(Theme.buttonText) // Updated Color
                    .cornerRadius(Theme.buttonCornerRadius) // Updated CornerRadius
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.buttonCornerRadius)
                            .stroke(Theme.buttonBorder, lineWidth: 1.5) // Added border
                    )
            }
            .disabled(fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .padding(.horizontal)
        }
        .padding(.bottom)
        .background(Theme.appBackground.edgesIgnoringSafeArea(.all)) // Updated Color
        .onAppear {
            // AudioManager init starts the engine
        }
        .onChange(of: fullMorseStringDisplay) { oldValue, newValue in
            debouncedUpdatePreviewTimer?.invalidate()
            debouncedUpdatePreviewTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false) { _ in
                updatePreviewImage(morse: newValue)
            }
        }
    }

    @ViewBuilder
    private func actionButton(title: String, baseColor: Color, icon: String? = nil, action: @escaping () -> Void, audioFeedback: (() -> Void)? = nil) -> some View {
        Button {
            audioFeedback?()
            action()
        } label: {
            HStack {
                if let iconName = icon {
                    Image(systemName: iconName)
                }
                Text(title)
            }
            .font(.custom("SpecialElite-Regular", size: 16)) // Updated Font
            .padding(.vertical, 10) // Adjusted padding
            .padding(.horizontal)
            .frame(maxWidth: .infinity)
            .background(baseColor) // Use baseColor directly, or Theme.buttonBackground
            .foregroundColor(Theme.buttonText) // Updated Color
            .cornerRadius(Theme.buttonCornerRadius) // Updated CornerRadius
            .overlay(
                RoundedRectangle(cornerRadius: Theme.buttonCornerRadius)
                    .stroke(Theme.buttonBorder, lineWidth: 1.5) // Added border
            )
            .shadow(color: baseColor.opacity(0.3), radius: 2, x: 1, y: 2) // Subtle shadow
        }
    }

    private struct DisplayBox: View {
        let title: String
        @Binding var content: String
        let font: Font
        let textColor: Color
        let backgroundColor: Color
        // @Environment(\.colorScheme) var colorScheme // Removed

        var body: some View {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.custom("SpecialElite-Regular", size: 12)) // Updated Font
                    .foregroundColor(Theme.textSecondary) // Updated Color
                ScrollView(.vertical, showsIndicators: true) {
                    Text(content.isEmpty ? "-" : content)
                        .font(font) // Font passed in
                        .foregroundColor(textColor) // Color passed in
                        .padding(8) // Adjusted padding
                        .frame(maxWidth: .infinity, minHeight: 40, alignment: .topLeading)
                        .lineLimit(nil)
                }
                .background(backgroundColor) // Color passed in
                .cornerRadius(Theme.displayCornerRadius) // Updated CornerRadius
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.displayCornerRadius) // Updated CornerRadius
                        .stroke(Theme.surfaceBorder, lineWidth: 1) // Added border
                )
                .frame(maxHeight: 80) // Adjusted maxHeight
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
