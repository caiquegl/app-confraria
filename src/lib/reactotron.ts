import Reactotron from "reactotron-react-native";

const reactotron = Reactotron.configure({ name: "Confraria" })
  .useReactNative()
  .connect();

export default reactotron;
