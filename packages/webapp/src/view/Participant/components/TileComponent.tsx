import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { animated } from "@react-spring/three";

export const TileComponent = (props) => {
  const colorMap = useLoader(
    TextureLoader,
    props.color === "light" ? "LightWood.jpg" : "DarkWood.jpg"
  );

  return (
    <mesh scale={[1, 0.5, 1]} receiveShadow castShadow {...props}>
      <boxGeometry />
      <animated.meshPhysicalMaterial map={colorMap} envMapIntensity={0.4} />
    </mesh>
  );
};
