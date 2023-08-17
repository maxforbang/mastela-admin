import * as React from "react";

interface EmailTemplateProps {
  name: string;
  propertyName: string;
  entryCode: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  name,
  entryCode,
  propertyName,
}) => (
  <div>
    <h1>Welcome, {name}!</h1>
    <p>
      {`We're so excited to have you in ${propertyName}. To enter the property, use
      the digital keypad on the front door.`}
    </p>
    <h2>Your code for entry is {entryCode}.</h2>
  </div>
);
