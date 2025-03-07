import * as React from "react";
import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  Button,
  IconButton,
  Modal,
  Select,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import { parseMarkdown, convertToMarkdown } from "../utils/parser";
import ReactMarkdown from "react-markdown";
import obsIndexedDBService, { ObsHistoryRecord } from "../utils/obsIndexedDB";
import { DialogModal } from "./DialogModal";

interface Section {
  id: number;
  imageUrl: string | undefined;
  text: string;
}

interface Content {
  title: string;
  sections: Section[];
  footnotes: string;
}

interface ObsContentProps {
  content: string;
  storyNum: string;
}

const LANGUAGES = [
  {
    code: "en",
    name: "English",
  },
  {
    code: "bn",
    name: "Bengali",
  },
  {
    code: "hi",
    name: "Hindi",
  },
  {
    code: "ml",
    name: "Malayalam",
  },
  {
    code: "ta",
    name: "Tamil",
  },
  {
    code: "te",
    name: "Telugu",
  },
  {
    code: "kn",
    name: "Kannada",
  },
  {
    code: "mr",
    name: "Marathi",
  },
  {
    code: "ur",
    name: "Urdu",
  },
];

const ObsEditor: React.FC<ObsContentProps> = ({ content, storyNum }) => {
  const [markdownContent, setMarkdownContent] = React.useState<Content | null>(
    null
  );
  const [editableContent, setEditableContent] = React.useState<Content | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [targetLanguage, setTargetLanguage] = React.useState("en");
  const [previewMarkdown, setPreviewMarkdown] = React.useState<string>("");
  const [showRightPanel, setShowRightPanel] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const [historyRecords, setHistoryRecords] = React.useState<
    ObsHistoryRecord[]
  >([]);
  const [selectedRecordKey, setSelectedRecordKey] = React.useState<
    string | null
  >(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState({
    title: "",
    message: "",
    variant: "warning" as "warning" | "error" | "info",
  });
  const [contentChanged, setContentChanged] = React.useState(false);
  const [previousStoryNum, setPreviousStoryNum] = React.useState<string | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  React.useEffect(() => {
    if (content) {
      const jsonData = parseMarkdown(content);
      setMarkdownContent(jsonData);
      // Reset editable content when left side content changes
      if (storyNum !== previousStoryNum) {
        setEditableContent(null);
        setShowRightPanel(false);
        setContentChanged(false);
        setPreviousStoryNum(storyNum);
      }
    }
  }, [content, storyNum, previousStoryNum]);

  // function to check if content has some changes
  const hasContentChanges = (content: Content | null): boolean => {
    if (!content) return false;

    if (content.title.trim() !== "") return true;

    const hasNonEmptySections = content.sections.some(
      (section) => section.text.trim() !== ""
    );
    if (hasNonEmptySections) return true;

    if (content.footnotes.trim() !== "") return true;

    return false;
  };

  // generate a markdown preview whenever editableContent changes
  React.useEffect(() => {
    if (editableContent) {
      const markdownString = convertToMarkdown(editableContent);
      setPreviewMarkdown(markdownString || "");

      const hasChanges = hasContentChanges(editableContent);
      setContentChanged(hasChanges);
      if (hasChanges) {
        obsIndexedDBService.scheduleContentSave(
          storyNum,
          targetLanguage,
          editableContent
        );
      }
    }
  }, [editableContent]);

  const copyStructureToRight = () => {
    if (markdownContent) {
      setEditableContent({
        title: "",
        sections: markdownContent.sections.map((section) => ({
          id: section.id,
          imageUrl: section.imageUrl,
          text: "",
        })),
        footnotes: "",
      });
      setShowRightPanel(true);
      setContentChanged(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setSnackbarOpen(true);
    setSnackbarMessage("Copied to clipboard!");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editableContent) {
      setEditableContent({ ...editableContent, title: e.target.value });
    }
  };

  const handleTextChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (editableContent) {
      const updatedSections = editableContent.sections.map((section) =>
        section.id === id ? { ...section, text: e.target.value } : section
      );
      setEditableContent({ ...editableContent, sections: updatedSections });
    }
  };

  const handleFootnoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editableContent) {
      setEditableContent({ ...editableContent, footnotes: e.target.value });
    }
  };

  const downloadMarkdown = () => {
    if (!editableContent) return;
    const downloadableContent = convertToMarkdown(editableContent);
    if (!downloadableContent) return null;
    const blob = new Blob([downloadableContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storyNum}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setEditableContent({
      title: "",
      sections: editableContent.sections.map((section) => ({
        id: section.id,
        imageUrl: section.imageUrl,
        text: "",
      })),
      footnotes: "",
    });
  };

  const openHistoryModal = async () => {
    if (contentChanged) {
      openDialog({
        title: "Unsaved Changes",
        message:
          "You have unsaved changes. Please export the content before importing to avoid overwriting.",
        variant: "warning",
      });
    } else {
      await loadHistoryRecords();
      setHistoryModalOpen(true);
    }
  };

  const openDialog = (config: {
    title: string;
    message: string;
    variant?: "warning" | "error" | "info";
  }) => {
    setDialogConfig({
      title: config.title,
      message: config.message,
      variant: config.variant || "warning",
    });
    setDialogOpen(true);
    setHistoryModalOpen(false);
  };

  const loadHistoryRecords = async () => {
    try {
      const records = await obsIndexedDBService.getAllRecords();
      setHistoryRecords(records);
    } catch (error) {
      console.error("Failed to load history records:", error);
    }
  };

  const handleRecordSelection = (key: string) => {
    setSelectedRecordKey((prevKey) => (prevKey === key ? null : key));
  };

  const handleUploadContent = async () => {
    if (!selectedRecordKey) return;

    // Find the selected record
    const selectedRecord = historyRecords.find(
      (record) => record.key === selectedRecordKey
    );
    if (!selectedRecord) return;

    // check if story numbers matches with source content
    if (selectedRecord.storyNum !== storyNum) {
      openDialog({
        title: "Story Number Mismatch!",
        message: "Can not import content from a different story.",
        variant: "error",
      });
      return;
    }

    // Set the content
    setEditableContent(selectedRecord.content);
    setTargetLanguage(selectedRecord.language);
    setShowRightPanel(true);
    setHistoryModalOpen(false);
    setContentChanged(false);
    setSelectedRecordKey(null);
    setSnackbarOpen(true);
    setSnackbarMessage("Content uploaded successfully!");
  };

  const handleClearHistory = async () => {
    try {
      await obsIndexedDBService.clearAllRecords();
      setHistoryRecords([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  if (!markdownContent) {
    return <Typography>No content available</Typography>;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        padding: 2,
      }}
    >
           <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%", backgroundColor: "green", color: "white" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          mb: 2,
        }}
      >
        <Typography variant="h6"></Typography>

        {!showRightPanel && (
          <IconButton
            onClick={copyStructureToRight}
            title="Edit/Translate"
            sx={{
              border: "1px solid gray",
              borderRadius: "50%",
              p: 1,
            }}
          >
            <ArrowForwardIcon fontSize="medium" />
          </IconButton>
        )}

        {/* Header for target content - only shown when right panel is displayed */}
        {showRightPanel && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "50%",
            }}
          >
            <Typography variant="h6"></Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ minWidth: 120 }}
                title="Select a Target Language"
              >
                {LANGUAGES.map((language) => (
                  <MenuItem key={language.code} value={language.code}>
                    {language.name}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                onClick={openHistoryModal}
                title="Open History Modal"
                style={{ textTransform: "none" }}
              >
                <OpenInNewIcon fontSize="medium" />
                {/* Import Existing */}
              </Button>
              <Button
                onClick={() => setPreviewOpen(true)}
                title="Preview"
                variant="contained"
              >
                <VisibilityIcon fontSize="medium" />
              </Button>
              <Button
                onClick={downloadMarkdown}
                title="Download"
                variant="contained"
              >
                <FileDownloadIcon fontSize="medium" />
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Main content container */}
      <Box
        sx={{
          display: "flex",
          border: "1px solid gray",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            overflowY: "auto",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: "100%",
                mb: 4,
              }}
            >
              {/* Left Title */}
              <Box
                sx={{
                  width: showRightPanel ? "50%" : "100%",
                  pr: showRightPanel ? 2 : 0,
                  transition: "width 0.3s ease",
                }}
              >
                <Typography variant="h5">
                  {markdownContent.title}
                  {showRightPanel && (
                    <IconButton
                      title="Copy"
                      onClick={() =>
                        copyToClipboard(markdownContent.title || "")
                      }
                      style={{ outline: "none" }}
                    >
                      <ContentCopyIcon style={{ fontSize: 20}} />
                    </IconButton>
                  )}
                </Typography>
                <Snackbar
                  open={open}
                  autoHideDuration={2000}
                  onClose={() => setOpen(false)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                  <Alert onClose={() => setOpen(false)} severity="success">
                    Copied to clipboard!
                  </Alert>
                </Snackbar>
              </Box>

              {/* Right Title - only when showRightPanel is true */}
              {showRightPanel && editableContent && (
                <Box
                  sx={{
                    width: "50%",
                    pl: 2,
                    borderLeft: "1px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="Enter Title..."
                      value={editableContent.title}
                      onChange={handleTitleChange}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Sections */}
            {markdownContent.sections.map((section, index) => (
              <Box
                key={`row-${section.id}`}
                sx={{
                  display: "flex",
                  width: "100%",
                  mb: 4,
                }}
              >
                {/* Left Section */}
                <Box
                  sx={{
                    width: showRightPanel ? "50%" : "100%",
                    pr: showRightPanel ? 2 : 0,
                    transition: "width 0.3s ease",
                  }}
                >
                  <Paper sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      {index + 1}
                    </Typography>

                    {section.imageUrl && (
                      <Box
                        component="img"
                        src={section.imageUrl}
                        alt={`Image ${section.id}`}
                        sx={{
                          width: showRightPanel ? "100%" : "80%",
                          marginLeft: showRightPanel ? 0 : "100px",
                          maxHeight: 300,
                          borderRadius: 2,
                          mb: 2,
                        }}
                      />
                    )}

                    <Typography>
                      {section.text}
                      {showRightPanel && (
                        <IconButton
                          onClick={() => copyToClipboard(section.text || "")}
                          style={{ outline: "none" }}
                        >
                          <ContentCopyIcon style={{ fontSize: 20}} />
                        </IconButton>
                      )}
                    </Typography>
                  </Paper>
                </Box>

                {/* Right Section - only when showRightPanel is true */}
                {showRightPanel && editableContent && (
                  <Box
                    sx={{
                      width: "50%",
                      pl: 2,
                      borderLeft: "1px solid #e0e0e0",
                    }}
                  >
                    <Paper sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        {index + 1}
                      </Typography>

                      {editableContent.sections[index].imageUrl && (
                        <Box
                          component="img"
                          src={editableContent.sections[index].imageUrl}
                          alt={`Image ${editableContent.sections[index].id}`}
                          sx={{
                            width: "100%",
                            maxHeight: 300,
                            borderRadius: 2,
                            mb: 2,
                          }}
                        />
                      )}

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          variant="outlined"
                          placeholder="Enter text..."
                          value={editableContent.sections[index].text}
                          onChange={(e) =>
                            handleTextChange(
                              editableContent.sections[index].id,
                              e
                            )
                          }
                          sx={{
                            "& .MuiInputBase-root": {
                              maxHeight: "120px",
                              overflow: "auto",
                            },
                            "& .MuiInputBase-input": {
                              overflow: "auto",
                              maxHeight: "120px",
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            ))}

            {/* Row for Footnotes */}
            <Box
              sx={{
                display: "flex",
                width: "100%",
                mb: 4,
              }}
            >
              {/* Left Footnotes */}
              <Box
                sx={{
                  width: showRightPanel ? "50%" : "100%",
                  pr: showRightPanel ? 2 : 0,
                  transition: "width 0.3s ease",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Footnotes:
                </Typography>
                <Typography>
                  {markdownContent.footnotes}
                  {showRightPanel && (
                    <IconButton
                      onClick={() =>
                        copyToClipboard(markdownContent.footnotes || "")
                      }
                      style={{ outline: "none" }}
                    >
                      <ContentCopyIcon style={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </Typography>
              </Box>

              {/* Right Footnotes - only when showRightPanel is true */}
              {showRightPanel && editableContent && (
                <Box
                  sx={{
                    width: "50%",
                    pl: 2,
                    borderLeft: "1px solid #e0e0e0",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Footnotes:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      variant="outlined"
                      placeholder="Enter footnotes..."
                      value={editableContent.footnotes}
                      onChange={handleFootnoteChange}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Markdown Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box
          sx={{
            maxWidth: "80%",
            maxHeight: "80vh",
            width: 800,
            p: 4,
            bgcolor: "white",
            borderRadius: 2,
            mx: "auto",
            mt: 10,
            position: "relative",
            overflowY: "auto",
          }}
        >
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>

          {editableContent ? (
            <Box sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
              >
                <Typography variant="h6">Preview</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => copyToClipboard(previewMarkdown)}
                >
                  Copy Markdown
                </Button>
              </Box>

              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  bgcolor: "#f8f9fa",
                  borderRadius: 2,
                  "& img": {
                    maxWidth: "100%",
                    height: "auto",
                    display: "block",
                    my: 2,
                  },
                }}
              >
                <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Typography>No data to preview</Typography>
            </Box>
          )}
        </Box>
      </Modal>
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Edit History
          <IconButton
            onClick={() => setHistoryModalOpen(false)}
            sx={{ marginLeft: "auto" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {historyRecords.length === 0 ? (
              <Typography>No history records found.</Typography>
            ) : (
              historyRecords.map((record) => (
                <Paper
                  key={record.key}
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    backgroundColor:
                      selectedRecordKey === record.key
                        ? "rgba(0,0,0,0.1)"
                        : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => handleRecordSelection(record.key)}
                >
                  <Checkbox
                    checked={selectedRecordKey === record.key}
                    onChange={() => handleRecordSelection(record.key)}
                    onClick={(e) => {
                      handleRecordSelection(record.key);
                    }}
                    sx={{
                      mr: 2,
                      padding: 0,
                      outline: "none",
                    }}
                  />

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">
                      Story: {record.storyNum}
                    </Typography>
                    <Typography variant="body2">
                      Last Edited: {record.lastEdited.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Created: {record.createdAt.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Language:{" "}
                      {LANGUAGES.find((lang) => lang.code === record.language)
                        ?.name || record.language}
                    </Typography>
                  </Box>
                </Paper>
              ))
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClearHistory}
            color="secondary"
            variant="outlined"
            style={{ textTransform: "none" }}
          >
            Clear History
          </Button>
          <Button
            onClick={handleUploadContent}
            color="primary"
            variant="contained"
            disabled={!selectedRecordKey}
            style={{ textTransform: "none" }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <DialogModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
      />
    </Box>
  );
};

export default ObsEditor;
