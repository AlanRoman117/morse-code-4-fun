//
//  ContentView.swift
//  TapperMessagesExtension
//
//  Created by Jules on [Current Date].
//

import SwiftUI
import CoreHaptics // For Haptic Feedback

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

// MARK: - Haptic Manager (Simplified)
private struct HapticFeedback {
    static private var engine: CHHapticEngine?

    static func prepare() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        do {
            engine = try CHHapticEngine()
            try engine?.start()
        } catch {
            print("Haptic engine Creation Error: \(error.localizedDescription)")
            engine = nil
        }
    }

    static func playTap() {
        guard let engine = engine else { return }
        var events = [CHHapticEvent]()
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.6)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.4)
        let event = CHHapticEvent(eventType: .hapticTransient, parameters: [intensity, sharpness], relativeTime: 0)
        events.append(event)
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: 0)
        } catch {
            // print("Failed to play tap haptic: \(error.localizedDescription)")
        }
    }

    static func playButtonPress() {
        guard let engine = engine else { return }
         var events = [CHHapticEvent]()
        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.8)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.6)
        let event = CHHapticEvent(eventType: .hapticTransient, parameters: [intensity, sharpness], relativeTime: 0)
        events.append(event)
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: 0)
        } catch {
            // print("Failed to play button press haptic: \(error.localizedDescription)")
        }
    }

    static func playSend() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    static func playClear() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.warning)
    }
}


struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme

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

            // Tap Button
            Button(action: {
                 // Action intentionally empty, gestures handle primary interaction.
            }) {
                Text("TAP AREA")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .padding()
                    .frame(maxWidth: .infinity)
                    .frame(height: 100) // Increased height
                    .background(isTapAreaPressed ? currentTapAreaActive : currentTapArea)
                    .foregroundColor(.white)
                    .cornerRadius(Theme.buttonCornerRadius + 5) // Slightly more rounded
                    .scaleEffect(isTapAreaPressed ? 0.96 : 1.0)
                    .shadow(color: currentTapArea.opacity(0.3), radius: isTapAreaPressed ? 3 : 8, x: 0, y: isTapAreaPressed ? 2 : 4)
            }
            .animation(.spring(response: 0.15, dampingFraction: 0.5), value: isTapAreaPressed)
            .simultaneousGesture(LongPressGesture(minimumDuration: shortTapThreshold)
                .onEnded { _ in
                    self.isTapAreaPressed = true
                    self.isLongPressTriggered = true
                    HapticFeedback.playTap()
                    self.handleTapInput(isLong: true)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { // Visual feedback duration
                        self.isTapAreaPressed = false
                    }
                }
            )
            .simultaneousGesture(TapGesture()
                .onEnded {
                    if !self.isLongPressTriggered {
                        self.isTapAreaPressed = true
                        HapticFeedback.playTap()
                        self.handleTapInput(isLong: false)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { // Visual feedback duration
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
                actionButton(title: "Next Letter", color: currentPositiveAction, action: processCurrentCharAction)
                actionButton(title: "Word Space", color: currentWarningAction, action: addWordSpaceAction)
            }
            .padding(.horizontal)


            actionButton(title: "Clear All", color: currentDestructiveAction, icon: "trash", action: clearAllAction, hapticFeedback: HapticFeedback.playClear)
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
                HapticFeedback.playSend()
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
            HapticFeedback.prepare() // Prepare haptics when view appears
        }
        .onChange(of: fullMorseStringDisplay) { newValue in
            debouncedUpdatePreviewTimer?.invalidate()
            debouncedUpdatePreviewTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false) { _ in
                updatePreviewImage(morse: newValue)
            }
        }
    }

    // Reusable Action Button
    @ViewBuilder
    private func actionButton(title: String, color: Color, icon: String? = nil, action: @escaping () -> Void, hapticFeedback: (() -> Void)? = HapticFeedback.playButtonPress) -> some View {
        Button {
            hapticFeedback?()
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

        activeMorseChar += isLong ? "-" : "."
        currentMorseCharDisplay = activeMorseChar

        lastTapTimestamp = Date()
        startLetterTimeoutTimer()
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

        guard !activeMorseChar.isEmpty else { return }

        fullMorseStringDisplay += activeMorseChar

        if let englishChar = morseConverter.morseToEnglish(morse: activeMorseChar) {
            decodedTextDisplay += englishChar
        } else {
            decodedTextDisplay += "?" // Placeholder for unrecognized morse
        }

        fullMorseStringDisplay += " " // Separator between morse characters

        activeMorseChar = ""
        currentMorseCharDisplay = ""

        if isAutoFinalized {
            // Optionally, play a subtle haptic or UI feedback for auto-finalization
        }
    }

    private func addWordSpaceAction() {
        invalidateLetterTimeoutTimer()

        if !activeMorseChar.isEmpty {
            processCurrentCharAction()
        }

        guard !fullMorseStringDisplay.isEmpty else { return }

        // Ensure we don't add multiple word spaces or a word space after nothing.
        let trimmedMorse = fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedMorse.isEmpty && !trimmedMorse.hasSuffix("/") {
            // Remove trailing space from last letter if present
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
            processCurrentCharAction()
        }

        let morseToSend = fullMorseStringDisplay.trimmingCharacters(in: .whitespacesAndNewlines)
        let textToSend = decodedTextDisplay.trimmingCharacters(in: .whitespacesAndNewlines)

        if !morseToSend.isEmpty { // Send if there's at least Morse code
            messagesViewController?.sendMessage(morse: morseToSend, text: textToSend)
        }
    }

    private func clearAllAction() {
        invalidateLetterTimeoutTimer()
        activeMorseChar = ""
        currentMorseCharDisplay = ""
        fullMorseStringDisplay = ""
        decodedTextDisplay = ""
        // Haptic already played by button's action
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
