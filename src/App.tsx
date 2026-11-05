import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "./components/Menu";
import { Garage } from "./components/Garage";
import { Circuits } from "./components/Circuits";
import { Settings } from "./components/Settings";
import { HowTo } from "./components/HowTo";
import { About } from "./components/About";
import { RaceScreen } from "./components/RaceScreen";
import { Results } from "./components/Results";
import { getAudio } from "./game/audio";
import { getCar, getTrack } from "./game/data";
import { DEFAULT_SETTINGS } from "./game/types";
import type {
  CarId,
  RaceConfig,
  RaceResult,
  ScreenName,
  Settings as SettingsType,
  TrackId,
} from "./game/types";

interface Profile {
  bestTimes: Partial<Record<TrackId, number>>;
  wins: number;
  races: number;
}

const SETTINGS_KEY = "neonrush-settings-v1";
const PROFILE_KEY = "neonrush-profile-v1";

const loadSettings = (): SettingsType => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SettingsType>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      master: typeof parsed.master === "number" ? parsed.master : DEFAULT_SETTINGS.master,
      music: typeof parsed.music === "number" ? parsed.music : DEFAULT_SETTINGS.music,
      sfx: typeof parsed.sfx === "number" ? parsed.sfx : DEFAULT_SETTINGS.sfx,
      quality:
        parsed.quality === "low" || parsed.quality === "medium" || parsed.quality === "high"
          ? parsed.quality
          : DEFAULT_SETTINGS.quality,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const loadProfile = (): Profile => {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { bestTimes: {}, wins: 0, races: 0 };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      bestTimes: parsed.bestTimes && typeof parsed.bestTimes === "object" ? parsed.bestTimes : {},
      wins: typeof parsed.wins === "number" ? parsed.wins : 0,
      races: typeof parsed.races === "number" ? parsed.races : 0,
    };
  } catch {
    return { bestTimes: {}, wins: 0, races: 0 };
  }
};

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("menu");
  const [carId, setCarId] = useState<CarId>("vanta");
  const [trackId, setTrackId] = useState<TrackId>("mirage");
  const [settings, setSettings] = useState<SettingsType>(() => loadSettings());
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [raceConfig, setRaceConfig] = useState<RaceConfig | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [recordInfo, setRecordInfo] = useState<{ newRecord: boolean; previous: number | null }>({
    newRecord: false,
    previous: null,
  });
  const lastMaster = useRef(settings.master > 0 ? settings.master : 0.8);

  const car = getCar(carId);
  const track = getTrack(trackId);
  const muted = settings.master === 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage may be unavailable in private windows.
    }
  }, [settings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // Storage may be unavailable in private windows.
    }
  }, [profile]);

  useEffect(() => {
    const audio = getAudio();
    audio.setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
  }, [settings.master, settings.music, settings.sfx]);

  const patchSettings = useCallback((patch: Partial<SettingsType>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      getAudio().setSettings({ master: next.master, music: next.music, sfx: next.sfx });
      return next;
    });
  }, []);

  // Every navigation starts at the top of the document so pages never open
  // mid-scroll (especially after returning from a full-screen race).
  useEffect(() => {
    if (screen === "race") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [screen]);

  const primeAudio = useCallback(() => {
    const audio = getAudio();
    audio.init();
    audio.setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
    return audio;
  }, [settings.master, settings.music, settings.sfx]);

  const navigate = useCallback(
    (next: ScreenName) => {
      const audio = primeAudio();
      audio.uiClick();
      if (!audio.debugState().music) {
        audio.setMusicMode("menu");
        audio.startMusic("menu");
      }
      setScreen(next);
    },
    [primeAudio]
  );

  const startRace = useCallback(
    (nextTrackId?: TrackId, nextCarId?: CarId) => {
      const selectedTrack = getTrack(nextTrackId ?? trackId);
      const selectedCar = getCar(nextCarId ?? carId);
      setTrackId(selectedTrack.id);
      setCarId(selectedCar.id);
      const audio = primeAudio();
      audio.uiConfirm();
      audio.setMusicMode("race");
      audio.startMusic("race");
      setRaceConfig({
        trackId: selectedTrack.id,
        carId: selectedCar.id,
        laps: selectedTrack.laps,
        quality: settings.quality,
        cameraShake: settings.cameraShake,
        master: settings.master,
        music: settings.music,
        sfx: settings.sfx,
      });
      setResult(null);
      setScreen("race");
    },
    [carId, primeAudio, settings.cameraShake, settings.master, settings.music, settings.quality, settings.sfx, trackId]
  );

  const exitRace = useCallback(() => {
    getAudio().setMusicMode("menu");
    getAudio().uiBack();
    setScreen("menu");
  }, []);

  const handleFinish = useCallback((nextResult: RaceResult) => {
    const previous = profile.bestTimes[nextResult.trackId] ?? null;
    const newRecord = previous === null || nextResult.totalTime < previous;
    setRecordInfo({ newRecord, previous });
    setProfile((current) => ({
      ...current,
      bestTimes: newRecord
        ? { ...current.bestTimes, [nextResult.trackId]: nextResult.totalTime }
        : current.bestTimes,
      wins: current.wins + (nextResult.won ? 1 : 0),
      races: current.races + 1,
    }));
    setResult(nextResult);
    getAudio().setMusicMode("menu");
    setScreen("results");
  }, [profile.bestTimes]);

  const toggleSound = useCallback(() => {
    const audio = primeAudio();
    if (settings.master > 0) {
      lastMaster.current = settings.master;
      patchSettings({ master: 0 });
      audio.setSettings({ master: 0, music: settings.music, sfx: settings.sfx });
    } else {
      const restored = lastMaster.current || 0.8;
      patchSettings({ master: restored });
      audio.setSettings({ master: restored, music: settings.music, sfx: settings.sfx });
      audio.uiClick();
    }
  }, [patchSettings, primeAudio, settings]);

  const testSound = useCallback(() => {
    const audio = primeAudio();
    audio.setSettings({ master: settings.master, music: settings.music, sfx: settings.sfx });
    audio.uiConfirm();
    if (!audio.debugState().music) {
      audio.setMusicMode("menu");
      audio.startMusic("menu");
    }
  }, [primeAudio, settings.master, settings.music, settings.sfx]);

  const resetData = useCallback(() => {
    setProfile({ bestTimes: {}, wins: 0, races: 0 });
    try {
      window.localStorage.removeItem(PROFILE_KEY);
    } catch {
      // ignore
    }
    primeAudio().uiBack();
  }, [primeAudio]);

  const selectCar = useCallback(
    (next: CarId) => {
      setCarId(next);
      primeAudio().uiClick();
    },
    [primeAudio]
  );

  const selectTrack = useCallback(
    (next: TrackId) => {
      setTrackId(next);
      primeAudio().uiClick();
    },
    [primeAudio]
  );

  const renderScreen = () => {
    switch (screen) {
      case "garage":
        return (
          <Garage
            car={car}
            carId={carId}
            track={track}
            bestTime={profile.bestTimes[track.id] ?? null}
            muted={muted}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onSelect={selectCar}
            onContinue={() => navigate("circuits")}
            onStartRace={() => startRace()}
          />
        );
      case "circuits":
        return (
          <Circuits
            car={car}
            track={track}
            bestTimes={profile.bestTimes}
            muted={muted}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onSelect={selectTrack}
            onStartRace={() => startRace()}
          />
        );
      case "settings":
        return (
          <Settings
            settings={settings}
            bestTimes={profile.bestTimes}
            muted={muted}
            onChange={patchSettings}
            onReset={() => patchSettings(DEFAULT_SETTINGS)}
            onResetData={resetData}
            onTestSound={testSound}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onStartRace={() => startRace()}
            onBack={() => navigate("menu")}
            onOpenAbout={() => navigate("about")}
          />
        );
      case "howto":
        return (
          <HowTo
            muted={muted}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onStartRace={() => startRace()}
          />
        );
      case "about":
        return (
          <About
            muted={muted}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onStartRace={() => startRace()}
            onOpenSettings={() => navigate("settings")}
          />
        );
      case "race":
        if (!raceConfig) return null;
        return (
          <RaceScreen
            key={`${raceConfig.trackId}-${raceConfig.carId}`}
            config={raceConfig}
            car={getCar(raceConfig.carId)}
            track={getTrack(raceConfig.trackId)}
            settings={settings}
            onSettingsChange={patchSettings}
            onFinish={handleFinish}
            onExit={exitRace}
          />
        );
      case "results":
        if (!result) {
          return (
            <Menu
              car={car}
              track={track}
              bestTime={profile.bestTimes[track.id] ?? null}
              muted={muted}
              onToggleSound={toggleSound}
              onNavigate={navigate}
              onStartRace={() => startRace()}
            />
          );
        }
        return (
          <Results
            result={result}
            car={getCar(result.carId)}
            track={getTrack(result.trackId)}
            previousBest={recordInfo.previous}
            newRecord={recordInfo.newRecord}
            totalWins={profile.wins}
            onRestart={() => startRace(result.trackId, result.carId)}
            onGarage={() => {
              setCarId(result.carId);
              setTrackId(result.trackId);
              navigate("garage");
            }}
            onMenu={() => navigate("menu")}
            onNavigate={navigate}
          />
        );
      case "menu":
      default:
        return (
          <Menu
            car={car}
            track={track}
            bestTime={profile.bestTimes[track.id] ?? null}
            muted={muted}
            onToggleSound={toggleSound}
            onNavigate={navigate}
            onStartRace={() => startRace()}
          />
        );
    }
  };

  return <div className="h-full min-h-dvh bg-[#05040d] text-[var(--ink)]">{renderScreen()}</div>;
}
