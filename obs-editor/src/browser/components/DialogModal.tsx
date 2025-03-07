import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

interface DialogModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  open,
  onClose,
  title,
  message,
  variant = 'warning',
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="md"
    >
      <DialogTitle id="alert-dialog-title" color={variant}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {cancelText}
        </Button>
        {onConfirm && (
          <Button 
            onClick={onConfirm} 
            color={variant === 'error' ? 'error' : 'primary'}
            variant="contained"
          >
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};