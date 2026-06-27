import TypingExperience from "../../features/typingExperience/TypingExperience";

const skill = "typing";

const renderContent = () => {
  switch (skill) {
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
  return <>{renderContent()}</>;
}

export default Main;
