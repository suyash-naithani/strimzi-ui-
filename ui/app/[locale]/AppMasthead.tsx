"use client";
import { useAppLayout } from "@/app/[locale]/AppLayoutProvider";
import { TechPreviewPopover } from "@/components/TechPreviewPopover";
import {
  Button,
  Label,
  Masthead,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@/libs/patternfly/react-core";
import { BarsIcon, QuestionCircleIcon } from "@/libs/patternfly/react-icons";
import { FeedbackModal } from "@patternfly/react-user-feedback";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { UserDropdown } from "./UserDropdown";

export function AppMasthead() {
  const t = useTranslations();
  const { data } = useSession();
  const { user } = data || {};
  const { toggleSidebar } = useAppLayout();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const openFeedbackModal = () => {
    setIsFeedbackModalOpen(true);
  };
  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
  };
  return (
    <>
      <Masthead>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label="Global navigation"
            onClick={toggleSidebar}
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadMain>
          <Link href={"/"} className={"pf-v5-c-masthead_brand"}>
            <img
              className={"pf-v5-c-brand"}
              src={"/Logo-Red_Hat-AMQ-A-Reverse-RGB.svg"}
              alt={t("common.title")}
              style={{ height: 48 }}
            />
          </Link>
        </MastheadMain>
        <MastheadContent>
          <Toolbar
            ouiaId="masthead-toolbar"
            id={"masthead-toolbar"}
            isFullHeight
            isStatic
          >
            <ToolbarContent id={"masthead-toolbar"}>
              <ToolbarGroup
                variant="icon-button-group"
                align={{ default: "alignRight" }}
                spacer={{ default: "spacerNone", md: "spacerMd" }}
              >
                <ToolbarGroup
                  variant="icon-button-group"
                  visibility={{ default: "hidden", lg: "visible" }}
                >
                  <ToolbarItem>
                    <TechPreviewPopover>
                      <Label color={"blue"} isCompact={true}>
                        Tech preview
                      </Label>
                    </TechPreviewPopover>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button
                      aria-label="Help"
                      variant={"plain"}
                      icon={<QuestionCircleIcon />}
                      ouiaId={"help-button"}
                      onClick={openFeedbackModal}
                    />
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarGroup>
              <UserDropdown
                username={user?.name || user?.email}
                picture={user?.picture}
              />
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
      <FeedbackModal
        onShareFeedback="https://github.com/eyefloaters/console/issues/new?assignees=&labels=&projects=&template=share-feeedback.md&title="
        onJoinMailingList="https://github.com/eyefloaters/console/issues/new?assignees=&labels=&projects=&template=inform-the-direction-of-products.md&title="
        onOpenSupportCase="https://access.redhat.com/support/cases/#/case/new/get-support?caseCreate=true"
        onReportABug="https://github.com/eyefloaters/console/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="
        feedbackImg={"/pf_feedback.svg"}
        isOpen={isFeedbackModalOpen}
        onClose={closeFeedbackModal}
      />
    </>
  );
}
