import React from "react"
import { DEFAULT_DEADLINE, DEFAULT_SLIPPAGE_TOLERANCE, MAX_SLIPPAGE_TOLERANCE, Settings } from "../../state";
import { ButtonGroup, EmptyButton, PercentageButton } from "../common/Button";
import { FlexColumn, FlexRow, Margin, MS, PT } from "../common/Display";
import { DropdownButton, DropdownMenu } from "../common/Dropdown";
import { GearIcon } from "../common/Icons";
import { InputGroup, InputTextGroup, NumberInput } from "../common/Input";
import { FormLabel, Label, TransactionWarningLabel } from "../common/Label";
import { MutedText, Title } from "../common/Text";
import { QuestionTooltip } from "../common/Tooltip";

interface TransactionSettings {
  id?: string;
  settings: Settings;
  defaultSlippageTolerance?: number;
  setSettings: (value: Settings) => void;
}

const TransactionSettings: React.FC<TransactionSettings> = ({settings, setSettings, id='settings', defaultSlippageTolerance= DEFAULT_SLIPPAGE_TOLERANCE}): JSX.Element => (
  <ButtonGroup>
    <DropdownButton id={id}>
      <GearIcon />
    </DropdownButton>
    <DropdownMenu size="300px">
      <Title>Transaction settings</Title>
      <FormLabel>
        Slippage tolerance
        <QuestionTooltip>
          Your transaction will revert if <br /> the price changes <br />unfacorably by more than<br />this percentage.
        </QuestionTooltip>
      </FormLabel>
      <FlexRow>
        <PercentageButton percentage={settings.percentage} onClick={() => setSettings({...settings, percentage: NaN})}>
          Auto
        </PercentageButton>
        <InputGroup>
          <NumberInput
            value={Number.isNaN(settings.percentage) ? '' : settings.percentage + ''}
            min={0}
            max={100}
            step={0.1}
            id="slippage-tolerance"
            className="border-right-0"
            placeholder={`${defaultSlippageTolerance}`}
            onChange={(value) => setSettings({
              ...settings,
              percentage: value ? parseFloat(value) : Number.NaN
            })}
          />
          <InputTextGroup>%</InputTextGroup>
        </InputGroup>
      </FlexRow>
      <PT size="2">
        {settings.percentage < defaultSlippageTolerance &&
          <TransactionWarningLabel>Your transaction may fail</TransactionWarningLabel>
        }
        {settings.percentage > defaultSlippageTolerance + MAX_SLIPPAGE_TOLERANCE &&
          <TransactionWarningLabel>Your transaction may be frontrun</TransactionWarningLabel>
        }
      </PT>
      <FormLabel>
        Deadline
        <QuestionTooltip>
          Your transaction will revert if<br />it is pending for more than<br />this period or time.
        </QuestionTooltip>
      </FormLabel>
      <FlexRow>
        <NumberInput
          min={1}
          max={30}
          step={1}
          placeholder={`${DEFAULT_DEADLINE}`}
          value={Number.isNaN(settings.deadline) ? '' : settings.deadline + ''}
          onChange={(value) => setSettings({...settings,
            deadline: value
              ? parseInt(value, 10)
              : Number.NaN,
          })}
        />
        <MS size="2">
          <MutedText>minutes</MutedText>
        </MS>
      </FlexRow>
    </DropdownMenu>
  </ButtonGroup>
);

export default TransactionSettings;
