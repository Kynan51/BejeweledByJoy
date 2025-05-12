import React from "react";
import { Dialog, DialogContent, DialogOverlay } from "@radix-ui/react-dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, description }) => {
  // Always hide DialogTitle and DialogDescription for all modals
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
      <DialogContent
        className="fixed inset-0 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white p-6 rounded shadow-lg">
          {/* DialogTitle and DialogDescription intentionally hidden for all modals */}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
