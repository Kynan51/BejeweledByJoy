import React from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
      <DialogContent
        className="fixed inset-0 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="bg-white p-6 rounded shadow-lg">
          <DialogTitle className="text-lg font-bold">Confirmation</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mb-4">
            Please confirm your action below.
          </DialogDescription>
          <p>Are you sure you want to delete this product?</p>
          <div className="flex justify-end space-x-4 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
