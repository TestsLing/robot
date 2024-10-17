import {
  Box,
  Button,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useDeleteSession } from "../../api/api";

export const DeleteSession = ({
  delSession,
  setDelSession,
  selectedItem,
  setAlertStatus,
}: any) => {
  const { mutateAsync, isPending } = useDeleteSession();

  const submitDelSession = async () => {
    try {
      await mutateAsync({ sessionID: selectedItem.SessionID });

      setAlertStatus({
        visible: true,
        msg: `Session ${selectedItem.SessionID} deleted`,
        type: "success",
      });
    } catch (error) {
      console.log(error);
      setAlertStatus({
        visible: true,
        msg: JSON.stringify(error),
        type: "error",
      });
    } finally {
      setDelSession(false);
    }
  };

  return (
    <Modal
      onDismiss={() => setDelSession(false)}
      visible={delSession}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={isPending}
              variant="link"
              onClick={() => setDelSession(false)}
            >
              Cancel
            </Button>
            <Button
              loading={isPending}
              variant="primary"
              onClick={submitDelSession}
            >
              Confirm
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Delete Session"
    >
      Are you sure you want to delete session <b>{selectedItem?.SessionID}</b>?
    </Modal>
  );
};
