import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  hideClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, hideClose }) => {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-black/60" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[1201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg max-h-[90vh] flex flex-col overflow-y-auto"
        >
          {!hideClose && (
            <DialogPrimitive.Close asChild>
              <button
                aria-label="Close"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default Modal;
