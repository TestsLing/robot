import "regenerator-runtime";

import { Ic } from "isepic-chess";
import { Suspense, useEffect, useState } from "react";
import { useCommentatorQuestion } from "../../api/api";
import Cookies from "universal-cookie";
import {
  MessageList,
  MessageInput,
  MainContainer,
  ChatContainer,
  TypingIndicator,
  ConversationHeader,
  SendButton,
  Sidebar,
  ConversationList,
  Conversation,
  EllipsisButton,
  Message,
} from "@chatscope/chat-ui-kit-react";
import mic from "./mic.png";

import { useQuery } from "@tanstack/react-query";

import { modelOptions } from "../../../Admin/pages/Sessions/modelOptions";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import {
  useGLTF,
  useTexture,
  Environment,
  OrthographicCamera,
  OrbitControls,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  LineBasicMaterial,
  LinearEncoding,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  sRGBEncoding,
} from "three";

import { Predictions } from "@aws-amplify/predictions";

import { Box, Button } from "@mui/material";

const cookies = new Cookies(null, { path: "/" });
const SessionID = cookies.get("ChessReinvent2024SessionID");

export const convertToSpeech = async (text: string) => {
  const { speech } = await Predictions.convert({
    textToSpeech: {
      source: {
        text,
      },
    },
  });

  const audio = new Audio();

  audio.src = speech.url;
  audio.play();
};

export const Commentator = () => {
  const [input, setInput] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [provider, setProvider] = useState({
    label: "Claude 3 Sonnet",
    value: "anthropic.claude-3-sonnet-20240229-v1:0",
  });

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const { mutateAsync, isPending } = useCommentatorQuestion(SessionID);

  const [board] = useState(Ic.initBoard());
  const latestMove = useQuery({ queryKey: ["latestMove", SessionID] }) as any;

  const [commentary, setCommentary] = useState([]);

  useEffect(() => {
    if (latestMove.data.Move) {
      board.loadFen(latestMove.data.Move);
    }
  }, [latestMove.data.Move]);

  const postQuestion = async () => {
    if (transcript) {
      try {
        const resp = await mutateAsync({
          History: commentary,
          Comment: transcript,
          Board: board.fen,
          Model: provider.value,
        });

        setCommentary((oldArray) => [
          ...oldArray,
          {
            Comment: transcript,
            Author: "@",
            Board: board.fen,
            Model: provider.value,
          },
          resp,
        ]);

        convertToSpeech(resp.Comment);
      } catch (error) {
        console.error(error);
      } finally {
        resetTranscript();
      }
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  useEffect(() => {
    if (!listening && transcript.length > 0) {
      async () => await postQuestion();
    }
  }, [listening]);

  return (
    <MainContainer
      style={{
        borderRadius: "10px",
      }}
    >
      <Sidebar position="left" hidden={sidebar}>
        <ConversationList>
          {modelOptions.map((providers) => {
            return providers.options.map((model) => {
              return (
                <Conversation
                  name={model.label}
                  onClick={() => {
                    setProvider(model);
                  }}
                  style={{
                    fontSize: ".75em",
                    fontWeight: 600,
                  }}
                />
              );
            });
          })}
        </ConversationList>
      </Sidebar>

      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Actions>
            <Box display={"flex"} gap={2}>
              {browserSupportsSpeechRecognition &&
                (listening ? (
                  <Button onClick={SpeechRecognition.stopListening}>
                    Stop
                  </Button>
                ) : (
                  <Button
                    disabled={isPending}
                    onClick={() => SpeechRecognition.startListening()}
                  >
                    <img width={"30px"} src={mic} alt="" />
                  </Button>
                ))}

              <EllipsisButton
                orientation="vertical"
                onClick={() => setSidebar(!sidebar)}
              />
            </Box>
          </ConversationHeader.Actions>

          <ConversationHeader.Content userName={provider.label} info="Active" />
        </ConversationHeader>

        <MessageList
          typingIndicator={
            isPending && <TypingIndicator content="GenAI is thinking" />
          }
        >
          {commentary.map(
            (msg: { SK: string; Author: string; Comment: string }, i) => {
              return (
                <Message
                  key={i}
                  model={{
                    position: "single",
                    sender: msg.Author,
                    message: msg.Comment,
                    direction: msg.Author.includes("@")
                      ? "outgoing"
                      : "incoming",
                  }}
                />
              );
            }
          )}
        </MessageList>
        <SendButton />
        <MessageInput
          value={transcript}
          disabled={isPending}
          attachButton={false}
          onSend={postQuestion}
          placeholder="Record and your message will appear here..."
          onChange={resetTranscript}
        />
      </ChatContainer>
      <Canvas
        dpr={2}
        onCreated={(ctx) => {
          (ctx.gl as any).physicallyCorrectLights = true;
        }}
        onClick={postQuestion}
      >
        <OrthographicCamera makeDefault zoom={1400} position={[0, 1.65, 1]} />

        <OrbitControls target={[0, 1.65, 0]} />

        <Suspense fallback={null}>
          <Environment
            background={false}
            files="/images/photo_studio_loft_hall_1k.hdr"
          />
        </Suspense>

        <Suspense fallback={null}>
          <Avatar />
        </Suspense>
      </Canvas>
    </MainContainer>
  );
};

const Avatar = () => {
  let gltf = useGLTF("/model.glb");
  let morphTargetDictionaryBody = null;
  let morphTargetDictionaryLowerTeeth = null;

  const [
    bodyTexture,
    eyesTexture,
    teethTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    // "/images/teeth_specular.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);

  for (const t of [
    bodyTexture,
    eyesTexture,
    teethTexture,
    teethNormalTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ]) {
    t.encoding = sRGBEncoding;
    t.flipY = false;
  }

  bodyNormalTexture.encoding = LinearEncoding;
  tshirtNormalTexture.encoding = LinearEncoding;
  teethNormalTexture.encoding = LinearEncoding;
  hairNormalTexture.encoding = LinearEncoding;

  gltf.scene.traverse((node: any) => {
    if (
      node.type === "Mesh" ||
      node.type === "LineSegments" ||
      node.type === "SkinnedMesh"
    ) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      if (node.name.includes("Body")) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new MeshPhysicalMaterial();
        node.material.map = bodyTexture;
        // node.material.shininess = 60;
        node.material.roughness = 1.7;
        // node.material.specularMap = bodySpecularTexture;
        node.material.roughnessMap = bodyRoughnessTexture;
        node.material.normalMap = bodyNormalTexture;
        node.material.normalScale = new Vector2(0.6, 0.6);
        morphTargetDictionaryBody = node.morphTargetDictionary;
        node.material.envMapIntensity = 0.8;
        // node.material.visible = false;
      }

      if (node.name.includes("Eyes")) {
        node.material = new MeshStandardMaterial();
        node.material.map = eyesTexture;
        // node.material.shininess = 100;
        node.material.roughness = 0.1;
        node.material.envMapIntensity = 0.5;
      }

      if (node.name.includes("Brows")) {
        node.material = new LineBasicMaterial({ color: 0x000000 });
        node.material.linewidth = 1;
        node.material.opacity = 0.5;
        node.material.transparent = true;
        node.visible = false;
      }

      if (node.name.includes("Teeth")) {
        node.receiveShadow = true;
        node.castShadow = true;
        node.material = new MeshStandardMaterial();
        node.material.roughness = 0.1;
        node.material.map = teethTexture;
        node.material.normalMap = teethNormalTexture;
        node.material.envMapIntensity = 0.7;
      }

      if (node.name.includes("Hair")) {
        node.material = new MeshStandardMaterial();
        node.material.map = hairTexture;
        node.material.alphaMap = hairAlphaTexture;
        node.material.normalMap = hairNormalTexture;
        node.material.roughnessMap = hairRoughnessTexture;
        node.material.transparent = true;
        node.material.depthWrite = false;
        node.material.side = 2;
        node.material.color.setHex(0x000000);
        node.material.envMapIntensity = 0.3;
      }

      if (node.name.includes("TSHIRT")) {
        node.material = new MeshStandardMaterial();
        node.material.map = tshirtDiffuseTexture;
        node.material.roughnessMap = tshirtRoughnessTexture;
        node.material.normalMap = tshirtNormalTexture;
        node.material.color.setHex(0xffffff);
        node.material.envMapIntensity = 0.5;
      }
    }
  });

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
};
