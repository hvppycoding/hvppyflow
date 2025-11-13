// https://github.com/nonsensejoke/korean-keyboard

export class KoreanInput {
    constructor() {
        // Keyboard mapping in normal state
        this.normalMap = {
            // Consonants (초성/종성)
            'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ',
            'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ',
            'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ',
            
            // Vowels (중성)
            'y': 'ㅛ', 'u': 'ㅕ', 'l': 'ㅣ', 'o': 'ㅐ', 'p': 'ㅔ',
            'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'i': 'ㅑ',
            'b': 'ㅠ', 'n': 'ㅜ', 'm': 'ㅡ'
        };

        // Keyboard mapping in Shift state
        this.shiftMap = {
            // Double consonants
            'Q': 'ㅃ', 'W': 'ㅉ', 'E': 'ㄸ', 'R': 'ㄲ', 'T': 'ㅆ',
            
            // Compound vowels
            'O': 'ㅒ', 'P': 'ㅖ',
            
            // Other keys keep original mapping (lowercase to uppercase)
            'q': 'ㅃ', 'w': 'ㅉ', 'e': 'ㄸ', 'r': 'ㄲ', 't': 'ㅆ',
            'o': 'ㅒ', 'p': 'ㅖ'
        };

        // Hangul character range constants
        this.HANGUL_BASE = 0xAC00;
        this.CHOSUNG_BASE = 0x1100;
        this.JUNGSUNG_BASE = 0x1161;
        this.JONGSUNG_BASE = 0x11A7;
        
        // Choseong (initials) (19)
        this.chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        
        // Jungseong (medials) (21)
        this.jungsungList = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
        
        // Jongseong (finals) (28, includes empty)
        this.jongsungList = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        // Full Hangul composition engine data structures (ported from reference project)
        this.initial = [12593, 12594, 12596, 12599, 12600, 12601, 12609, 12610, 12611, 12613, 12614, 12615, 12616, 12617, 12618, 12619, 12620, 12621, 12622];
        this.finale = [0, 12593, 12594, 12595, 12596, 12597, 12598, 12599, 12601, 12602, 12603, 12604, 12605, 12606, 12607, 12608, 12609, 12610, 12612, 12613, 12614, 12615, 12616, 12618, 12619, 12620, 12621, 12622];
        this.dMedial = [0, 0, 0, 0, 0, 0, 0, 0, 0, 800, 801, 820, 0, 0, 1304, 1305, 1320, 0, 0, 1820];
        this.dFinale = [0, 0, 0, 119, 0, 422, 427, 0, 0, 801, 816, 817, 819, 825, 826, 827, 0, 0, 1719, 0, 0];
        
        // Unicode constants
        this.SBase = 44032;
        this.LBase = 4352;
        this.VBase = 12623;
        this.TBase = 4519;
        this.LCount = 19;
        this.VCount = 21;
        this.TCount = 28;
        this.NCount = 588;
        this.SCount = 11172;

        // Input mode state
        this.mode = 'EN'; // 'KO' or 'EN'

        // Removal mode state
        this.removeMode = "Syllable"; // "Syllable" or "Jamo"
    }

    isKoreanMode() {
        return this.mode === 'KO';
    }

    isEnglishMode() {
        return this.mode === 'EN';
    }
    
    setKoreanMode() {
        this.mode = 'KO';
    }

    setEnglishMode() {
        this.mode = 'EN';
    }

    isRemoveModeSyllable() {
        return this.removeMode === "Syllable";
    }
    
    isRemoveModeJamo() {
        return this.removeMode === "Jamo";
    }

    setRemoveModeToSyllable() {
        this.removeMode = "Syllable";
    }
    
    setRemoveModeToJamo() {
        this.removeMode = "Jamo";
    }

    // Find index of a value in an array (utility)
    indexOf(array, value) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }

    // Get character mapping
    getCharacter(key, isShift) {
        if (isShift && this.shiftMap[key]) {
            return this.shiftMap[key];
        }
        return this.normalMap[key.toLowerCase()] || null;
    }

    // Complete Hangul composition algorithm (ported and optimized from reference project)
    composeHangul(inputString) {
        const length = inputString.length;
        if (length === 0) {
            return "";
        }
        
        let currentCharCode = inputString.charCodeAt(0);
        let result = String.fromCharCode(currentCharCode);
        
        for (let i = 1; i < length; i++) {
            const nextCharCode = inputString.charCodeAt(i);
            
            const initialIndex = this.indexOf(this.initial, currentCharCode);
            
            // Initial + medial → syllable
            if (initialIndex !== -1) {
                const vowelOffset = nextCharCode - this.VBase;
                if (0 <= vowelOffset && vowelOffset < this.VCount) {
                    currentCharCode = this.SBase + (initialIndex * this.VCount + vowelOffset) * this.TCount;
                    result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode);
                    continue;
                }
            }
            
            // Vowel + vowel → compound vowel
            const currentVowelOffset = currentCharCode - this.VBase;
            const nextVowelOffset = nextCharCode - this.VBase;
            if (0 <= currentVowelOffset && currentVowelOffset < this.VCount && 
                0 <= nextVowelOffset && nextVowelOffset < this.VCount) {
                const dMedialIndex = this.indexOf(this.dMedial, (currentVowelOffset * 100) + nextVowelOffset);
                if (dMedialIndex > 0) {
                    currentCharCode = this.VBase + dMedialIndex;
                    result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode);
                    continue;
                }
            }
            
            const syllableOffset = currentCharCode - this.SBase;
            
            // Syllable + final → complete syllable
            if (0 <= syllableOffset && syllableOffset < 11145 && (syllableOffset % this.TCount) === 0) {
                const finaleIndex = this.indexOf(this.finale, nextCharCode);
                if (finaleIndex !== -1) {
                    currentCharCode += finaleIndex;
                    result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode);
                    continue;
                }
                
                // Handle compound medial
                const vowelIndex = Math.floor((syllableOffset % this.NCount) / this.TCount);
                const dMedialIndex = this.indexOf(this.dMedial, (vowelIndex * 100) + (nextCharCode - this.VBase));
                if (dMedialIndex > 0) {
                    currentCharCode += (dMedialIndex - vowelIndex) * this.TCount;
                    result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode);
                    continue;
                }
            }
            
            // Complete syllable + vowel → split final + new syllable (key fix!)
            if (0 <= syllableOffset && syllableOffset < 11172 && (syllableOffset % this.TCount) !== 0) {
                const finaleIndex = syllableOffset % this.TCount;
                const vowelOffset = nextCharCode - this.VBase;
                
                if (0 <= vowelOffset && vowelOffset < this.VCount) {
                    const newInitialIndex = this.indexOf(this.initial, this.finale[finaleIndex]);
                    if (0 <= newInitialIndex && newInitialIndex < this.LCount) {
                        // Remove final, create new syllable
                        result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode - finaleIndex);
                        currentCharCode = this.SBase + (newInitialIndex * this.VCount + vowelOffset) * this.TCount;
                        result = result + String.fromCharCode(currentCharCode);
                        continue;
                    }
                    
                    // Handle compound final decomposition
                    if (finaleIndex < this.dFinale.length && this.dFinale[finaleIndex] !== 0) {
                        result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode - finaleIndex + Math.floor(this.dFinale[finaleIndex] / 100));
                        currentCharCode = this.SBase + (this.indexOf(this.initial, this.finale[(this.dFinale[finaleIndex] % 100)]) * this.VCount + vowelOffset) * this.TCount;
                        result = result + String.fromCharCode(currentCharCode);
                        continue;
                    }
                }
                
                // Handle compound final
                const dFinaleIndex = this.indexOf(this.dFinale, (finaleIndex * 100) + this.indexOf(this.finale, nextCharCode));
                if (dFinaleIndex > 0) {
                    currentCharCode = currentCharCode + dFinaleIndex - finaleIndex;
                    result = result.slice(0, result.length - 1) + String.fromCharCode(currentCharCode);
                    continue;
                }
            }
            
            // Cannot compose; append new character
            currentCharCode = nextCharCode;
            result = result + String.fromCharCode(nextCharCode);
        }
        
        return result;
    }

    // Decompose Hangul characters (per reference project)
    decomposeHangul(inputString) {
        const length = inputString.length;
        let result = "";
        
        for (let i = 0; i < length; i++) {
            const charCode = inputString.charCodeAt(i);
            const syllableOffset = charCode - this.SBase;
            
            // Check if Hangul syllable
            if (syllableOffset < 0 || syllableOffset >= this.SCount) {
                result += String.fromCharCode(charCode);
                continue;
            }
            
            // Decompose syllable
            const initialIndex = Math.floor(syllableOffset / this.NCount);
            const vowelCode = this.VBase + Math.floor((syllableOffset % this.NCount) / this.TCount);
            const finaleCode = this.finale[syllableOffset % this.TCount];
            
            result += String.fromCharCode(this.initial[initialIndex], vowelCode);
            if (finaleCode !== 0) {
                result += String.fromCharCode(finaleCode);
            }
        }
        
        return result;
    }

    // Smart insert — improved handling of Hangul composition with completion detection
    smartInsert(currentText, cursorStart, cursorEnd, newChar) {
        // 1. Build new text: insert new character
        const textBefore = currentText.substring(0, cursorStart);
        const textAfter = currentText.substring(cursorEnd);
        const tempText = textBefore + newChar + textAfter;
        const tempCursorPos = cursorStart + newChar.length;
        
        // 2. Hangul composition: try sequences of different lengths
        for (let testLength = Math.min(4, tempCursorPos); testLength >= 2; testLength--) {
            const testChars = tempText.substring(tempCursorPos - testLength, tempCursorPos);
            const composed = this.composeHangul(testChars);
            
            // 3. If composition succeeds (length reduces or content changes), replace
            if (composed.length < testChars.length || composed !== testChars) {
                const newText = tempText.substring(0, tempCursorPos - testLength) + composed + tempText.substring(tempCursorPos);
                const newCursorPos = tempCursorPos - testLength + composed.length;
                
                return {
                    text: newText,
                    cursorPosition: newCursorPos,
                };
            }
        }
        
        return {
            text: tempText,
            cursorPosition: tempCursorPos,
        };
    }

    // Reset state
    reset() {
        this.setRemoveModeToSyllable();
    }

    // Handle backspace — using the new decomposeHangul implementation
    handleBackspace(currentText) {
        if (currentText.length === 0) return '';

        if (this.isRemoveModeSyllable()) {
            // Remove entire syllable
            this.reset();
            return currentText.slice(0, -1);
        }
        
        const lastChar = currentText[currentText.length - 1];
        const decomposedLastChar = this.decomposeHangul(lastChar);

        // Check if Hangul character (by decomposed length)
        if (decomposedLastChar.length > 1) {
            // Is Hangul; process per reference logic
            const decomposedArray = Array.from(decomposedLastChar);
            if (decomposedArray.length > 1) {
                // Remove the last jamo, then recompose
                const remaining = decomposedArray.slice(0, -1).join('');
                const recomposed = this.composeHangul(remaining);
                if (recomposed.length == 0) {
                    this.reset();
                }
                return currentText.slice(0, -1) + recomposed;
            }
        }
        
        // Not Hangul or cannot decompose; delete directly
        this.reset();
        return currentText.slice(0, -1);
    }

    isEditorShortcut(e){
        const altGraph = e.getModifierState && e.getModifierState('AltGraph');
        const ctrlMeta = e.ctrlKey || e.metaKey;
        const ctrlAlt  = e.ctrlKey && e.altKey;
        return altGraph || ctrlAlt || ctrlMeta;
    }

    handleKeyDown(e) {
        const editable = e.target;
        if (!this.isKoreanMode()) return;

        if (!editable) return;

        if (editable.tagName !== 'INPUT' && editable.tagName !== 'TEXTAREA') return;

        if (this.isEditorShortcut(e)) {
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            
            // Get cursor positions
            const cursorStart = editable.selectionStart;
            const cursorEnd = editable.selectionEnd;
            
            if (cursorStart === cursorEnd) {
                // Simple delete: remove one character before cursor
                if (cursorStart > 0) {
                    const textBefore = editable.value.substring(0, cursorStart);
                    const textAfter = editable.value.substring(cursorStart);
                    
                    // Apply smart Hangul backspace to text before cursor
                    const newTextBefore = this.handleBackspace(textBefore);
                    const newText = newTextBefore + textAfter;
                    
                    editable.value = newText;
                    
                    // Set new cursor position
                    const newCursorPos = newTextBefore.length;
                    editable.setSelectionRange(newCursorPos, newCursorPos);
                }
            } else {
                // Selection delete: remove selected text
                const textBefore = editable.value.substring(0, cursorStart);
                const textAfter = editable.value.substring(cursorEnd);
                const newText = textBefore + textAfter;
                
                editable.value = newText;
                editable.setSelectionRange(cursorStart, cursorStart);

                this.reset();
            }
            
            // Note: do not call koreanInput.reset() here; state already restored above
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            
            const cursorStart = editable.selectionStart;
            const textBefore = editable.value.substring(0, cursorStart);
            const textAfter = editable.value.substring(editable.selectionEnd);
            
            editable.value = textBefore + ' ' + textAfter;
            
            // Move cursor after the space
            const newCursorPos = cursorStart + 1;
            editable.setSelectionRange(newCursorPos, newCursorPos);
            
            // Reset Hangul input state
            this.reset();
            
            return;
        }

        // Ignore other special keys
        if (e.key.length > 1 && e.key !== 'Shift') {
            this.reset();
            return;
        }

        const char = this.getCharacter(e.key, e.shiftKey);
        if (char) {
            e.preventDefault();
            // Update input content
            const cursorPos = editable.selectionStart;
            // New Hangul input logic: smart cursor insertion handling
            const insertResult = this.smartInsert(editable.value, cursorPos, editable.selectionEnd, char);
            // Update text and cursor position
            editable.value = insertResult.text;
            editable.setSelectionRange(insertResult.cursorPosition, insertResult.cursorPosition);
            this.setRemoveModeToJamo();
        }
    }
}
