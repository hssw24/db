import React, { useState, useEffect, useRef } from 'react';
import './VolumeMonitor.css';

const VolumeMonitor = () => {
    const [isLoud, setIsLoud] = useState(false);
    const [threshold, setThreshold] = useState(25); // Default threshold is 60 dB
    const [currentVolume, setCurrentVolume] = useState(0); // Display current volume
    const [displayedVolume, setDisplayedVolume] = useState(0); // Delayed display volume
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const dataArrayRef = useRef(null);
    const alarmSoundRef = useRef(null);

    useEffect(() => {
        // Setup alarm sound
        alarmSoundRef.current = new Audio('https://www.soundjay.com/button/beep-07.wav');
        
        // Initialize audio context and getUserMedia
        async function initAudio() {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
            
            microphoneRef.current.connect(analyserRef.current);

            // Start monitoring volume
            monitorVolume();
        }

        const monitorVolume = () => {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const avgVolume = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;

            // Convert to decibels (approximation)
            const decibels = 20 * Math.log10(avgVolume);
            setCurrentVolume(decibels.toFixed(2)); // Update internal volume state

            if (decibels > threshold && !isLoud) {
                setIsLoud(true);
                playAlarm();
            } else if (decibels <= threshold && isLoud) {
                setIsLoud(false);
            }

            // Call monitorVolume recursively for continuous checking
            requestAnimationFrame(monitorVolume);
        };

        const playAlarm = () => {
            if (alarmSoundRef.current) {
                alarmSoundRef.current.play();
                setTimeout(() => {
                    alarmSoundRef.current.pause();
                    alarmSoundRef.current.currentTime = 0;
                }, 2000);
            }
        };

        // Initialize audio on component mount
        initAudio();

        // Cleanup function to stop audio when component unmounts
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [isLoud, threshold]);

    // Update displayed volume with a delay for readability
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDisplayedVolume(currentVolume);
        }, 500);
        return () => clearTimeout(timeout);
    }, [currentVolume]);

    const handleThresholdChange = (event) => {
        setThreshold(Number(event.target.value));
    };

    return (
        <div className={`volume-monitor ${isLoud ? 'alert' : ''}`}>
            <h1>Volume Monitor</h1>
            <p>Aktuelle Lautstärke: {displayedVolume} dB</p>
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
