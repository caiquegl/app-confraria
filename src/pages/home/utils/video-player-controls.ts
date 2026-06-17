import type { VideoPlayer } from "expo-video";

export function setVideoPlayerMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

export function playVideoPlayer(player: VideoPlayer) {
  player.play();
}

export function pauseVideoPlayer(player: VideoPlayer) {
  player.pause();
}
