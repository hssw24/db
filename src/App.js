import React, { useState, useEffect, useRef } from 'react';
import './VolumeMonitor.css';

const VolumeMonitor = () => {
let db = 0;
    const [isLoud, setIsLoud] = useState(false);
    const [threshold, setThreshold] = useState(50); // Standardgrenzwert auf 25 dB
    const [displayedVolume, setDisplayedVolume] = useState(0);
    const [alarmActive, setAlarmActive] = useState(false); // Alarmzustand
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const dataArrayRef = useRef(null);
    const alarmTimeoutRef = useRef(null);

    useEffect(() => {
        // Initialisierung der Audioüberwachung
        async function initAudio() {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
            microphoneRef.current.connect(analyserRef.current);
            monitorVolume();
        }

        // Lautstärkeüberwachung
        const monitorVolume = () => {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const avgVolume = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;

            const decibels = 20 * Math.log10(avgVolume + 1); // Dezibelberechnung
            setDisplayedVolume((prev) => (prev * 0.8 + decibels * 0.2).toFixed(2)); // Glättung der Anzeige
            // Wenn Lautstärke höher als Grenzwert und Alarm noch nicht aktiv, Alarm auslösen

db = 25;
// NICK: Hier muss der Fehler liegen. Ton und Meldung lösen IMMER aus!
            if (decibels > threshold && !alarmActive) {
                triggerAlarm();
            }

            requestAnimationFrame(monitorVolume);
        };

        // Alarm auslösen
        const triggerAlarm = () => {
            setAlarmActive(true);
            setIsLoud(true);
            playAlarmSound();

            // Setzt den Alarmstatus nach 5 Sekunden zurück
            if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
            alarmTimeoutRef.current = setTimeout(() => {
                setIsLoud(false);
                setAlarmActive(false);
            }, 5000);
        };

        // Piepton für Alarm
        const playAlarmSound = () => {
            const beepAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = beepAudioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, beepAudioContext.currentTime);
            oscillator.connect(beepAudioContext.destination);
            oscillator.start();
            oscillator.stop(beepAudioContext.currentTime + 0.5);
        };

        initAudio();

        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
            if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
        };
    }, [threshold]);

    const handleThresholdChange = (event) => setThreshold(Number(event.target.value));

    return (
        <div className={`volume-monitor ${isLoud ? 'alert' : ''}`}>
            <h1>Volume Monitor 3 mit gpt</h1>
            <p>Aktuelle Lautstärke: {displayedVolume} dB (db: {db})</p>
            <p>{isLoud ? "Lautstärke überschritten!" : "Lautstärke im normalen Bereich"}</p>

            {isLoud && (
                <div className="alarm-text">
                    Alarm
                </div>
            )}

            <h3>Wählen Sie den Grenzwert:</h3>
            {[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70].map((value) => (
                <label key={value} style={{ marginRight: '10px' }}>
                    <input
                        type="radio"
                        value={value}
                        checked={threshold === value}
                        onChange={handleThresholdChange}
                    />
                    {value} dB
                </label>
            ))}
        </div>
    );
};

export default VolumeMonitor;
