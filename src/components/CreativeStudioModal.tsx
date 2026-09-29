import React, { useState } from "react";
import {
  X,
  Image as ImageIcon,
  Music,
  Video,
  Upload,
  Sparkles,
  Loader2,
  Download,
  Send,
  Play,
  RotateCcw,
} from "lucide-react";

interface CreativeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string, attachmentUrl?: string) => void;
}

export const CreativeStudioModal: React.FC<CreativeStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<"image" | "music" | "video">("image");

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspect, setImageAspect] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [imageInputFile, setImageInputFile] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Music Generation State
  const [musicPrompt, setMusicPrompt] = useState("");
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoInputImage, setVideoInputImage] = useState<string | null>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === "image") setImageInputFile(dataUrl);
      else setVideoInputImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Generate Image
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() && !imageInputFile) return;

    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspect,
          base64Image: imageInputFile || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Image generation request failed.");
      }

      const data = await res.json();
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      console.error("Image generation error:", err);
      setImageError(err.message || "Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate Music
  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim() || isGeneratingMusic) return;

    setIsGeneratingMusic(true);
    setMusicError(null);
    setGeneratedMusicUrl(null);

    try {
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: musicPrompt.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Music generation request failed.");
      }

      const data = await res.json();
      setGeneratedMusicUrl(data.audioDataUrl);
    } catch (err: any) {
      console.error("Music generation error:", err);
      setMusicError(err.message || "Failed to generate music clip.");
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Generate Video
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() && !videoInputImage) return;

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoStatusMsg("Initiating video generation pipeline...");

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspect,
          base64Image: videoInputImage || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Video generation request failed.");
      }

      const data = await res.json();
      setVideoStatusMsg(`Generation job active: ${data.operationName}. Processing cinematic frames...`);
    } catch (err: any) {
      console.error("Video generation error:", err);
      setVideoError(err.message || "Failed to generate video.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Creative Media Studio</h3>
              <p className="text-xs text-zinc-400">
                Generate high-resolution visual imagery, dynamic music clips, and cinematic video.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 border-b border-zinc-800/80 bg-zinc-950">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab("image")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "image"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Image Creation & Edit</span>
            </button>
            <button
              onClick={() => setActiveTab("music")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "music"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Music className="w-3.5 h-3.5 text-rose-400" />
              <span>Music Studio</span>
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "video"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>Video & Motion</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs">
          {/* TAB 1: Image Studio */}
          {activeTab === "image" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <form onSubmit={handleGenerateImage} className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Prompt Description</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. Minimalist isometric architectural render of a futuristic glass pavilion at twilight, sharp focus, volumetric lighting..."
                    rows={3}
                    required
                    className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Aspect Ratio */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">Aspect Ratio</label>
                    <select
                      value={imageAspect}
                      onChange={(e) => setImageAspect(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Portrait</option>
                      <option value="4:3">4:3 Standard</option>
                    </select>
                  </div>

                  {/* Optional Image Input */}
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">Reference Image (Optional)</label>
                    <label className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer">
                      <span className="truncate">
                        {imageInputFile ? "Image Attached" : "Upload Reference..."}
                      </span>
                      <Upload className="w-3.5 h-3.5 shrink-0 ml-2" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "image")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {imageError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    {imageError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Image...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Generate Visual Artwork</span>
                    </>
                  )}
                </button>
              </form>

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">Generated Imagery:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={generatedImage}
                        download="nova_generated_artwork.png"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button
                        onClick={() => {
                          onSendToChat(`Generated Image: "${imagePrompt}"`, generatedImage);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to Chat</span>
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-zinc-850 bg-black flex items-center justify-center max-h-[380px]">
                    <img src={generatedImage} alt="Generated visual" className="max-h-[380px] object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Music Studio */}
          {activeTab === "music" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <form onSubmit={handleGenerateMusic} className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Musical Description / Genre Direction</label>
                  <textarea
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder="e.g. 30-second atmospheric lo-fi beats with gentle piano chords and ambient vinyl crackle..."
                    rows={3}
                    required
                    className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                  />
                </div>

                {musicError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    {musicError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingMusic || !musicPrompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingMusic ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Composing Soundtrack...</span>
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4" />
                      <span>Generate Music Clip</span>
                    </>
                  )}
                </button>
              </form>

              {/* Music Player */}
              {generatedMusicUrl && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">Generated Composition:</span>
                    <a
                      href={generatedMusicUrl}
                      download="nova_composition.wav"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audio</span>
                    </a>
                  </div>
                  <audio src={generatedMusicUrl} controls className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Video & Motion */}
          {activeTab === "video" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <form onSubmit={handleGenerateVideo} className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Scene Description / Motion Direction</label>
                  <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. Drone flyover above mist-shrouded mountain peaks at sunrise with golden morning rays..."
                    rows={3}
                    className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">Video Aspect Ratio</label>
                    <select
                      value={videoAspect}
                      onChange={(e) => setVideoAspect(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Portrait / Reel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-300">Photo to Animate (Optional)</label>
                    <label className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer">
                      <span className="truncate">
                        {videoInputImage ? "Photo Attached" : "Upload Photo..."}
                      </span>
                      <Upload className="w-3.5 h-3.5 shrink-0 ml-2" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "video")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {videoError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    {videoError}
                  </div>
                )}

                {videoStatusMsg && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                    {videoStatusMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingVideo || (!videoPrompt.trim() && !videoInputImage)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Video Frames...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Generate Cinematic Video</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
