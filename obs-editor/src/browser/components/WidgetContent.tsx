import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Snackbar, Alert } from "@mui/material";

interface WidgetContentProps {
  openContent: (content: string, storyNum: string) => void;
}

const WidgetContent: React.FC<WidgetContentProps> = ({ openContent }) => {
  const [lang, setLang] = useState("");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const storyArray = Array.from({ length: 50 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const langObjArray = [
    { code: "en", language: "English" },
    { code: "bn", language: "Bengali" },
    { code: "hi", language: "Hindi" },
    { code: "ml", language: "Malayalam" },
    { code: "ta", language: "Tamil" },
    { code: "te", language: "Telugu" },
    { code: "kn", language: "Kannada" },
    { code: "mr", language: "Marathi" },
    { code: "ur", language: "Urdu" },
  ];

  const extractNumber = (input: string): string | null => {
    const match = input.match(/^(\d+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (lang !== "") {
      setShowGrid(true);
    } else {
      setShowGrid(false);
    }
    setStory("");
  }, [lang]);
  const fetchStoryContent = async () => {
    if (lang === "") {
      setError("Please select a language.");
      return;
    }
    setLoading(true);
    setError("");
    setFileName("");
    if (fileInputRef && fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    try {
      const response = await fetch(
        `https://git.door43.org/Door43-Catalog/${lang}_obs/raw/branch/master/content/${story}.md`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const text = await response.text();
      const storyNum = extractNumber(story);
      if (storyNum !== null) {
        openContent(text, storyNum);
        setSnackbarOpen(true);
        setSnackbarMessage(`Story ${storyNum} successfully loaded!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadContent = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filename = file.name;
    setFileName(filename);
    console.log(fileName, "filename");
    const storyNum = filename ? extractNumber(filename) : null;
    if (storyNum !== null) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        openContent(text, storyNum);
        setSnackbarOpen(true);
        setSnackbarMessage(`Story ${storyNum} successfully loaded!`);

        // Reset to default state
        setLang("");
        setStory("");
      };
      reader.readAsText(file);
    } else {
      console.error("Unknown error occurred");
      setError("File name must begin with a story number (eg.01.md, 11.md).");
    }
  };

  return (
    <div
      className="widget-container"
      style={{ maxHeight: "80vh", overflowY: "auto", padding: "10px" }}
    >
      <h2 className="widget-header">Welcome! 👋</h2>
      <label className="widget-label">Select Language</label>
      <select
        className="widget-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={{outline: "none"}}
      >
        <option value="" disabled>
          --Select Language--
        </option>
        {langObjArray.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.language}
          </option>
        ))}
      </select>
      {showGrid && (
        <>
          <div className="story-selection">
            <label
              className="widget-label"
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Select Story
            </label>
            <div
              className="story-grid"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                justifyContent: "flex-start",
                maxWidth: "300px",
                margin: "0 auto",
              }}
            >
              {storyArray.map((storyNum) => (
                <button
                  key={storyNum}
                  className={`story-button ${
                    story === storyNum ? "selected" : ""
                  }`}
                  onClick={() => setStory(storyNum)}
                  style={{
                    padding: "5px",
                    borderRadius: "3px",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    backgroundColor: story === storyNum ? "#808080" : "#fff",
                    color: story === storyNum ? "#fff" : "#000",
                    border: "1px solid #A9A9A9",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {storyNum}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        className="widget-button"
        onClick={fetchStoryContent}
        disabled={!lang || !story}
      >
        Fetch Content
      </button>

      {loading && <p className="widget-message">Loading...</p>}
      <div className="separator">
        <hr className="separator-line" />
        <span style={{ fontWeight: "bold" }}>OR</span>
        <hr className="separator-line" />
      </div>
      <div className="upload-section">
        <label className="widget-label">Upload content (.md file)</label>
        <input
          type="file"
          accept=".md"
          onChange={uploadContent}
          className="file-input"
          ref={fileInputRef}
        />
        {error && <p className="widget-error">{error}</p>}
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} // Position
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%", backgroundColor: "green", color: "white" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Embed the keyframes animation in a style tag */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `,
        }}
      />
    </div>
  );
};

export default WidgetContent;
