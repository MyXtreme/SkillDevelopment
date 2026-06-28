import TypingExperience from "../../features/typingExperience/TypingExperience";
import { useAppContext, type AppStateType } from "../../context/appContext";

// TODO: Later the router should set dynamically the context variable

const renderContent = (app: AppStateType) => {
  switch (app.skill) {
    case "typing":
      return <TypingExperience />;
    /*
        TODO: Other skills rendering
        case "reading":
            return <>coming soon</>
        case "memory":
            return <>coming soon</>
        */
    default:
      return <></>;
  }
};
function Main() {
  const { app } = useAppContext();
  return <>{renderContent(app)}</>;
}

export default Main;
